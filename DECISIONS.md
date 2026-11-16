# Melo V2 — Architectural Decision Records (ADR)

## ADR-001: Go REST API as the Single Trusted Boundary
- **Context:** The original application contained direct client-side Supabase PostgREST queries in `AdminPanelScreen.kt`. Exposing database credentials or direct database endpoints from Android or browser clients is insecure.
- **Decision:** All privileged operations, database interactions, R2 presigned URL generation, and FCM push notifications must go through a standalone Go REST API.
- **Status:** Accepted.
- **Consequences:** Android and Next.js admin clients never possess database credentials or Cloudflare R2 secrets. All access requires Firebase ID tokens verified on the Go backend.

## ADR-002: Neon PostgreSQL with Strict User Scoping
- **Context:** Relational data includes user accounts, device tokens, cloud library items, playlists, community items, announcements, app releases, and audit logs.
- **Decision:** Use Neon PostgreSQL with connection pooling (`pgxpool`), parameterized queries, and strict `user_id` scoping in application logic.
- **Status:** Accepted.

## ADR-003: Preserving Media3 / ExoPlayer Engine and Offline-First Local Room DB
- **Context:** The existing player has a highly tuned playback architecture (crossfade, pitch/tempo, gapless playback, cache encryption, multi-provider lyrics).
- **Decision:** Retain the existing Media3 implementation and Room database (`song.db`, version 28). Do not rewrite the playback engine. Cloud sync will operate asynchronously and never block audio playback.
- **Status:** Accepted.

## ADR-004: App Update Distribution Security
- **Context:** Previous app updater queried GitHub releases directly without validating file checksums or package integrity.
- **Decision:** App releases will be managed via the backend `/v1/app/update` endpoint. The Android client will verify the downloaded APK's SHA-256 hash and package name before invoking Android's system `PackageInstaller`. No silent installation.
- **Status:** Accepted.

## ADR-005: Cloudflare R2 for Image Assets Only
- **Context:** Melo V2 requires user avatars, custom playlist artwork, and announcement banners.
- **Decision:** Use Cloudflare R2 (S3-compatible API) with short-lived presigned PUT URLs for uploads. The backend verifies the uploaded object key, content-type, and size before activating the asset. No copyrighted music or audio files will be stored in R2.
- **Status:** Accepted.

## ADR-006: Application ID Migration to com.music.melo
- **Context:** The upstream application used `com.sarwar.melo` as the application ID. For Melo V2 branding and clean release, the dedicated identifier `com.music.melo` was selected.
- **Decision:** Updated Android `applicationId` to `com.music.melo` in `app/build.gradle.kts`, shortcuts XML, database release schema default, and Go update handler fallback. Firebase Android app registration is mapped to `com.music.melo`.
- **Status:** Accepted.
