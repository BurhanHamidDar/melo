# Melo V2 — Neon PostgreSQL Database Specification

## 1. Overview

Melo V2 uses **Neon Serverless PostgreSQL** as its single, authoritative relational database. The schema is normalized, indexed for high-concurrency read/write operations, and managed via versioned migration files in `backend/migrations/`.

- **Neon Project Endpoint:** `ep-fragrant-forest-ao5ittzg.c-2.ap-southeast-1.aws.neon.tech`
- **Application Pooling URL (PgBouncer):** `postgresql://neondb_owner:***@ep-fragrant-forest-ao5ittzg-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Direct Migration URL:** `postgresql://neondb_owner:***@ep-fragrant-forest-ao5ittzg.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

---

## 2. Relational Schema & Tables

### 2.1 Identity & User Profiles
- `users`: Core account record. Linked to Firebase via `firebase_uid TEXT UNIQUE`. Stores username, display name, bio, avatar asset reference, visibility, and status (`active`, `suspended`, `banned`, `deletion_pending`).
- `user_settings`: User application and player preferences stored as JSONB.
- `user_devices`: Push notification tokens and client installations. Unique on `(user_id, device_install_id)`. Tracks `fcm_token`, `platform`, `app_version_code`, and last heartbeat.

### 2.2 Media Assets
- `media_assets`: Metadata catalog for assets stored in Cloudflare R2 (`melo-images`). Tracks `bucket_name`, `object_key`, `visibility`, `content_type`, `byte_size`, and verification `status` (`pending`, `verified`, `failed`).

### 2.3 User Library & Synchronization
- `user_library_items`: Individual saved songs, albums, and artists. Indexed on `(user_id, is_liked, updated_at DESC)`.
- `sync_mutations`: Monotonically sequenced event ledger for multi-device sync. Contains `client_mutation_id`, `entity_type`, `entity_id`, `operation`, and `payload`.

### 2.4 Playlists & Collaboration
- `playlists`: User-created and community playlists. Supports `visibility` (`private`, `unlisted`, `public`) and `is_collaborative` flag.
- `playlist_tracks`: Ordered tracks in a playlist using lexicographical `position_key`. Unique on `(playlist_id, provider, provider_item_id)`.
- `playlist_members`: Collaborator permissions (`editor`, `viewer`).
- `playlist_follows`: User bookmarks and follows for public/unlisted playlists.

### 2.5 Administration & Governance
- `admin_roles`: Authoritative administrative permissions: `super_admin`, `content_manager`, `moderator`.
- `admin_audit_logs`: Immutable security audit trail recording actor, action, target, reason, and metadata.
- `reports`: Community moderation reports for playlists, user profiles, or announcements. Status: `open`, `reviewing`, `resolved`, `dismissed`.
- `announcements`: Remote push/in-app announcements. Severity: `info`, `important`, `critical`.
- `app_releases`: Official application updates with mandatory SHA-256 binary validation and rollout percentages.
- `feature_flags`: Dynamic remote toggles with typed JSON configuration.

---

## 3. Database Migrations

Database migrations are executed using the built-in Go migration tool:

```bash
cd backend
go run ./cmd/migrate
```

### Applied Migrations:
1. `00001_initial_schema.sql`: Complete 18-table schema, uuid-ossp extension, constraints, and performance indexes.
2. `00002_update_package_name.sql`: Updated default package name constraint in `app_releases` to `com.music.melo`.
