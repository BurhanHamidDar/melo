-- Melo V2 Initial Database Schema
-- Target: Neon PostgreSQL
-- Applied via goose or internal migration runner

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid TEXT NOT NULL UNIQUE,
    email TEXT NULL,
    username CITEXT NULL UNIQUE,
    display_name TEXT NULL,
    bio TEXT NULL,
    avatar_asset_id UUID NULL,
    profile_visibility TEXT NOT NULL DEFAULT 'private' CHECK (profile_visibility IN ('private', 'public')),
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned', 'deletion_pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    notification_preferences JSONB NOT NULL DEFAULT '{"announcements": true, "app_updates": true, "community": true}'::jsonb,
    listening_history_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Devices (FCM & installation mapping)
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_install_id UUID NOT NULL,
    platform TEXT NOT NULL DEFAULT 'android',
    app_version_code BIGINT NULL,
    app_version_name TEXT NULL,
    device_label TEXT NULL,
    fcm_token TEXT NULL,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_device UNIQUE (user_id, device_install_id)
);
CREATE INDEX IF NOT EXISTS idx_user_devices_fcm_token ON user_devices (fcm_token) WHERE fcm_token IS NOT NULL;

-- Media Assets (Cloudflare R2 metadata)
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('avatar', 'playlist_cover', 'announcement_banner', 'admin_asset')),
    bucket_name TEXT NOT NULL,
    object_key TEXT NOT NULL UNIQUE,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
    content_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL,
    width INTEGER NULL,
    height INTEGER NULL,
    sha256 TEXT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'deleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign key for avatar in users
ALTER TABLE users ADD CONSTRAINT fk_user_avatar FOREIGN KEY (avatar_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- User Library Items (Liked songs, saved albums/artists)
CREATE TABLE IF NOT EXISTS user_library_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'youtube',
    provider_item_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('track', 'album', 'artist', 'playlist')),
    title TEXT NOT NULL,
    artist_name TEXT NULL,
    album_title TEXT NULL,
    artwork_source_url TEXT NULL,
    is_liked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_library_item UNIQUE (user_id, provider, item_type, provider_item_id)
);
CREATE INDEX IF NOT EXISTS idx_library_user_type ON user_library_items(user_id, item_type);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NULL,
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
    cover_asset_id UUID NULL REFERENCES media_assets(id) ON DELETE SET NULL,
    is_collaborative BOOLEAN NOT NULL DEFAULT FALSE,
    revision BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_playlists_owner ON playlists(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists(visibility) WHERE visibility = 'public' AND deleted_at IS NULL;

-- Playlist Tracks
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'youtube',
    provider_item_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist_name TEXT NULL,
    album_title TEXT NULL,
    artwork_source_url TEXT NULL,
    position_key TEXT NOT NULL,
    added_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_playlist_track_pos UNIQUE (playlist_id, position_key)
);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks ON playlist_tracks(playlist_id, position_key);

-- Playlist Members (Collaborators)
CREATE TABLE IF NOT EXISTS playlist_members (
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
    invited_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (playlist_id, user_id)
);

-- Playlist Follows
CREATE TABLE IF NOT EXISTS playlist_follows (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, playlist_id)
);

-- Listening History (Strictly opt-in)
CREATE TABLE IF NOT EXISTS listening_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'youtube',
    provider_item_id TEXT NOT NULL,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    played_duration_ms BIGINT NULL,
    device_install_id UUID NULL
);
CREATE INDEX IF NOT EXISTS idx_history_user_time ON listening_history(user_id, played_at DESC);

-- Sync Mutations (Idempotent cloud sync ledger)
CREATE TABLE IF NOT EXISTS sync_mutations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_mutation_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_mutation UNIQUE (user_id, client_mutation_id)
);
CREATE INDEX IF NOT EXISTS idx_sync_mutations_user_id ON sync_mutations(user_id, id);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_asset_id UUID NULL REFERENCES media_assets(id) ON DELETE SET NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'important', 'critical')),
    target_channel TEXT NULL,
    target_min_version_code BIGINT NULL,
    starts_at TIMESTAMPTZ NULL,
    ends_at TIMESTAMPTZ NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(status, starts_at, ends_at);

-- App Releases
CREATE TABLE IF NOT EXISTS app_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL DEFAULT 'android',
    channel TEXT NOT NULL DEFAULT 'stable' CHECK (channel IN ('stable', 'beta')),
    version_code BIGINT NOT NULL,
    version_name TEXT NOT NULL,
    min_supported_version_code BIGINT NOT NULL,
    package_name TEXT NOT NULL DEFAULT 'com.music.melo',
    artifact_bucket TEXT NULL,
    artifact_key TEXT NULL,
    download_url TEXT NULL,
    sha256 TEXT NOT NULL,
    signing_cert_sha256 TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    release_notes TEXT NOT NULL,
    rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'published', 'paused', 'withdrawn')),
    mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_app_release UNIQUE (platform, channel, version_code)
);
CREATE INDEX IF NOT EXISTS idx_releases_channel_status ON app_releases(platform, channel, status, version_code DESC);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    key TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    min_version_code BIGINT NULL,
    channel TEXT NULL,
    updated_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Moderation Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'playlist', 'announcement', 'other')),
    target_id UUID NULL,
    reason TEXT NOT NULL,
    details TEXT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
    moderator_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    resolution_note TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);

-- Admin Roles (Super Admin, Content Manager, Moderator)
CREATE TABLE IF NOT EXISTS admin_roles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'content_manager', 'moderator')),
    created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NULL,
    target_id TEXT NULL,
    reason TEXT NULL,
    request_id TEXT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON admin_audit_logs(actor_user_id, created_at DESC);
