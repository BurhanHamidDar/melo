# MELO — Backend, Database, Storage & Admin Panel Implementation PRD

**Document type:** Master implementation specification for the coding agent  
**Project:** Melo Android music application + Melo Admin  
**Android source of truth:** https://github.com/techxsarwar/melo.git  
**Status:** Approved scope  
**Primary objective:** Keep the existing modified Melo Android application and its music experience intact. Add the backend infrastructure, user authentication/cloud data, Cloudflare R2 storage, push notifications, app-update management, and a separate admin web panel.

---

## 0. Critical instruction — understand the project correctly

The existing repository at `https://github.com/techxsarwar/melo.git` is the modified Android music application delivered by the user's colleague. **This is the application we are extending.**

The colleague's work is the starting point. The user has NOT already integrated Neon, Cloudflare R2, Firebase Authentication, Firebase Cloud Messaging, the new backend, or the new admin panel. The coding agent must implement those components now.

### Do not misunderstand the task

- Do not migrate to NomaTune or any other Android repository.
- Do not rebuild the music app from scratch.
- Do not replace the current music player, streaming providers, playback engine, UI, or existing features.
- Do not assume Neon, R2, Firebase Auth, or FCM already exist in this repository.
- Do not waste time comparing this codebase with an old Melo version, NomaTune, or hypothetical previous integrations.
- Do not remove existing functionality just because it is not mentioned in this document.
- Do inspect the existing repository to learn its actual architecture, Android build variants, package/application ID, Room database, current updater (if any), signing configuration, and safe integration points.

Repository inspection is required so new code fits the actual application. It is **not** an exercise in comparing integrations that have not been implemented.

### Product principle

**Melo remains the same music app users already enjoy.** Backend services and the admin panel are additive. A user should still be able to open Melo and listen to music without being forced to create an account. Accounts unlock cloud sync and account-linked features; they must not become a prerequisite for basic playback.

---

# 1. Product goals

Build the infrastructure that lets the Melo team manage and improve the existing app without needing to release a new APK for every announcement or supported remote setting.

The final system consists of:

1. **Existing Melo Android app** — retain current music functionality and UI; add optional account sign-in, cloud sync, remote update checks, remote announcements/configuration, and FCM integration where supported.
2. **Go backend API** — trusted server-side layer connecting Android/admin clients to Neon, R2, and Firebase Admin SDK.
3. **Neon PostgreSQL** — persistent application data: accounts/profile mappings, preferences, synced user library, device tokens, announcements, releases, configuration, and audit logs.
4. **Cloudflare R2** — image/media assets managed by Melo (avatars, announcement artwork, banners) and signed app-release files such as APKs. Do not use R2 as a proxy for the existing music provider's audio streams.
5. **Firebase Authentication** — identity provider for Melo users and admin users.
6. **Firebase Cloud Messaging** — push notifications to supported app builds/devices.
7. **Melo Admin web application** — secure admin dashboard for releases, update policy, announcements, push notifications, assets, configuration, users, and audit history.

### Not in scope

- Rewriting or redesigning the existing music player.
- Replacing YouTube Music/InnerTube or any existing music provider.
- Hosting, re-uploading, or redistributing commercial music audio.
- Building a separate music catalog or streaming service backend.
- Replacing local Room storage with a network-only database.
- Requiring sign-in before the user can play music.
- Building a social network, comments, follows, or public profiles unless explicitly approved in a later phase.
- Adding new music features unrelated to the backend/admin requirements.

---

# 2. Mandatory repository audit and baseline

## 2.1 Clone and inspect the actual source

If the provided workspace is empty, clone:

```bash
git clone https://github.com/techxsarwar/melo.git
cd melo
```

If the repository is already present, inspect it in place. Do not reclone over or overwrite the user's workspace. Preserve existing branches and uncommitted changes.

Read and inspect all relevant source, not just the README:

- `README.md`, `LICENSE`, contributing and build documentation.
- `settings.gradle.kts`, root and module Gradle files, version catalog.
- `app/` source, manifests, resources, navigation, dependency injection, networking and persistence.
- Every included provider/module and existing music integration.
- Room entities, DAOs, database migrations and DataStore/preferences.
- Existing updater/release-checking/downloading code, if present.
- Firebase/Google Services configuration, if present, but do not assume it exists.
- Build flavors/build types (including GMS/FOSS variants if present).
- Application ID, namespace, version code/name, min/target SDK, signing setup, ABI handling.
- Existing CI workflows and release artifact naming.

## 2.2 Build the untouched baseline first

Before editing:

1. Record current Git commit/branch and working-tree status.
2. Follow the repository's documented build instructions.
3. Assemble at least the primary debug variant and any other variants that are expected to remain supported.
4. Run existing unit tests, lint or checks where practical.
5. Record any pre-existing build failures separately from new failures.
6. Install/run the baseline app on an emulator/device if available and smoke-test the key music flows.

## 2.3 Produce a concise audit report

Create `docs/implementation-audit.md` containing:

- Actual app architecture and module map.
- Existing playback and provider architecture (to be preserved).
- Existing Room/DataStore structures and best integration points.
- Whether an in-app updater already exists and what it can/cannot do.
- Build variants and which ones have Google Play Services.
- Package ID, versioning and signing constraints.
- Existing settings/navigation locations suitable for account and update settings.
- Baseline build/test results and pre-existing issues.
- Specific implementation plan for adding backend features without altering existing player behavior.

After writing the audit, **continue into implementation**. Do not stop after producing a plan or ask the user to manually perform routine coding tasks. Ask for secrets only when they are genuinely required to connect/deploy a live external service; until then use typed environment placeholders and local mocks.

---

# 3. Fixed technology stack

Use this stack unless the repository/tooling reveals a hard incompatibility. If a change is necessary, explain it in the audit and choose the smallest compatible alternative.

| Layer | Technology | Responsibility |
|---|---|---|
| Android client | Existing Kotlin + Jetpack Compose project | Existing music app plus small integrations |
| Local data | Existing Room/DataStore | Offline-first local library and preferences |
| Backend | Go | API, authorization, Neon and R2 access, Firebase token verification, release policy |
| Database | Neon PostgreSQL | Persistent application data |
| Object storage | Cloudflare R2 | Images/assets and release APKs |
| Authentication | Firebase Authentication | Listener and administrator identity |
| Push | Firebase Cloud Messaging | Release notices and announcements |
| Admin frontend | Next.js + TypeScript | Separate web administration panel |
| Admin UI | Tailwind CSS + shadcn/ui (or equivalent consistent component system) | Responsive dashboard UI |
| Go database access | pgx; use sqlc if it improves type safety | PostgreSQL queries |
| Migrations | Versioned SQL migrations (goose, golang-migrate, or equivalent) | Reproducible schema changes |
| API contract | REST + OpenAPI 3.1 | Typed API contract and documentation |

Use a monorepo layout unless the current workspace has a clear existing convention:

```text
melo-workspace/
  android/                 # existing Android project; do not move it unnecessarily
  backend/                 # Go API
  admin/                   # Next.js admin app
  infra/
    db/migrations/
    scripts/
  docs/
    implementation-audit.md
    architecture.md
    api/openapi.yaml
    deployment.md
    operations.md
  .env.example
  README.md
```

If the Android app already occupies the repository root, keep it there. Add `backend/`, `admin/`, `infra/`, and `docs/` alongside it rather than performing a disruptive folder migration.

---

# 4. Android application requirements

## 4.1 Preserve the existing application

The Android app's current appearance, navigation, music providers, audio behavior and features are the baseline. Avoid broad refactors. New integration code must live in separate packages/modules following the app's existing architecture.

Preserve, as applicable to the actual source:

- YouTube Music/InnerTube discovery and playback.
- Existing music providers and metadata integrations.
- Media3/ExoPlayer playback service and notification controls.
- Queue, playlists, likes, history and local library behavior.
- Lyrics and synchronized lyrics.
- Downloads/offline cache.
- Audio effects, equalizer, crossfade and other player controls.
- Existing TV, widgets, car/Android Auto, Bluetooth and background behavior.
- Existing themes, settings, localization and accessibility.

Do not change the playback networking path to route songs through the Go API or R2. Music should continue to be obtained and played through the app's existing provider implementation.

## 4.2 Optional account system

Add an account area/settings entry with:

- Continue as guest.
- Sign in with Google where supported by the current app/build variant.
- Email/password or email-link authentication using Firebase Auth (choose the most straightforward secure Firebase-supported method and document it).
- Sign out.
- Display name and avatar.
- Account status and last sync status.
- Delete account flow with clear confirmation and server-side data deletion.

Basic listening must work without an account. Do not show a blocking login screen at startup.

### Firebase Authentication flow

1. Android signs in with Firebase Authentication.
2. Firebase SDK supplies a Firebase ID token.
3. Android sends the ID token as `Authorization: Bearer <firebase-id-token>` to the Go API.
4. Go backend verifies the token using Firebase Admin SDK / token verification and checks issuer, audience, expiry and project.
5. Backend derives the Firebase UID from the verified token. Never trust a UID sent by the client as the acting user identity.
6. Backend creates or updates the user's `profiles` record on first authenticated request.
7. Backend issues no custom long-lived application password/session unless a documented need exists. Firebase remains the identity provider.

Never store Firebase passwords in Neon. Never embed Firebase Admin service account credentials in the APK or browser bundle.

## 4.3 Cloud sync — offline-first

The app must remain usable offline. Room remains the local source of truth for immediate UI updates. Neon stores the authenticated user's cloud copy.

Initial sync scope:

- Liked/saved tracks.
- User-created playlists and playlist ordering.
- Playlist entries.
- Followed artists/albums only if the existing app has these concepts.
- User preferences/settings that are safe to sync.
- Listening history only when the user explicitly enables history sync; default to privacy-preserving behavior.

Represent a track by stable provider identity (`provider`, `provider_item_id`) and metadata needed to rebuild its UI. Do not store expiring audio stream URLs as durable library data.

### Sync behavior

- Guest mode remains local-only.
- On sign-in, offer/perform a clear local-to-cloud merge; do not silently discard either side.
- Use UUIDs for client-created entities so offline writes can be reconciled.
- Use `created_at`, `updated_at`, and `deleted_at`/tombstone semantics.
- Prefer server versions for records changed on multiple devices, but preserve local-only data and resolve conflicts deterministically. Document the exact policy.
- Queue writes locally when offline and retry with exponential backoff and jitter.
- Make mutations idempotent using entity IDs and/or idempotency keys.
- Avoid duplicate tracks in playlists where the current app's behavior disallows duplicates.
- Expose sync state: synced, pending, offline, or failed.
- Do not block playback while sync is running.

## 4.4 FCM integration

- Register the device's FCM token after permission/availability checks and authenticated association where applicable.
- Send token to the backend over an authenticated endpoint.
- Refresh tokens using Firebase's token refresh callback and update the backend.
- Remove/deactivate the device token on logout or when registration is invalidated.
- Handle notification taps and deep links safely.
- Support notification categories: app update available, important release, announcement, and operational notice.
- Use `notification_id`/`announcement_id` in payloads and fetch trusted content from the API; do not trust arbitrary payload text as executable navigation or configuration.

### Build-variant compatibility

Inspect actual flavors before integrating. If the app has GMS and FOSS/no-GMS variants:

- Include Firebase Messaging only in compatible GMS variants.
- Provide a no-op push abstraction for no-GMS builds so they compile and keep all other functionality.
- Do not introduce Google Play Services dependencies into FOSS variants unintentionally.
- Document that remote push may be unavailable in no-GMS builds; the app can still fetch announcements/update information when opened.
- Do not silently remove any currently supported build variant.

## 4.5 Remote configuration and update checks

Add a small, isolated `RemoteAppRepository` (or equivalent) that fetches public app configuration and latest release metadata. Use caching and sensible network timeouts. The app must start and play music when this API is unavailable.

Remote configuration may control only explicitly supported, safe settings such as:

- Maintenance notice/banner.
- Announcement visibility.
- Stable/beta update channel selection.
- Minimum supported version policy.
- Feature availability toggles for features that already exist in the app.

Remote configuration must never download or execute arbitrary code, scripts, or DEX files. Do not make critical player behavior dependent on a successful remote config request.

## 4.6 App update client

Inspect the app for an existing updater first. If one exists, extend it to consume the new release API while preserving its UI/behavior where possible. If none exists, implement a minimal native Android update flow.

Required behavior:

1. Fetch latest release for this package, installed version, channel, and compatible build variant/ABI.
2. Display version name, release notes, file size and update type.
3. Support optional and mandatory updates.
4. Download APK via a short-lived signed R2 URL using Android DownloadManager or WorkManager (choose based on existing app patterns).
5. Show progress, retry and cancellation where appropriate.
6. Verify downloaded SHA-256 before installation.
7. Validate the expected package/application identity and ensure the APK is signed with the expected release signing identity where practical.
8. Launch Android's package installer using FileProvider/content URI and required user approval.
9. Handle install failure, cancellation and insufficient storage gracefully.
10. Never claim a standard Android app can silently install updates. Normal sideload APK installation requires the user's system confirmation unless the device is specially managed.

A rollback action in the admin panel must not imply that Android can downgrade an installed version silently. A rollback should repoint the release policy to a compatible release artifact with a version code higher than the installed version, or publish a corrective forward release. Document this limitation.

---

# 5. Go backend API

The Go API is the trusted boundary between clients and external infrastructure. Android and the browser must not connect directly to Neon using privileged credentials or directly hold R2 secret keys.

## 5.1 Backend structure

Use clear separation such as:

```text
backend/
  cmd/api/
  internal/
    config/
    http/
      middleware/
      handlers/
      responses/
    auth/
    users/
    library/
    devices/
    releases/
    announcements/
    assets/
    remoteconfig/
    admin/
    audit/
    database/
    storage/r2/
    notifications/fcm/
  migrations/              # or shared infra/db/migrations
  openapi/
  Dockerfile
  go.mod
```

Use context-aware handlers, structured logging, typed errors, request validation, pagination, timeouts and graceful shutdown. Do not put all logic in `main.go` or HTTP handlers.

## 5.2 Authentication and authorization middleware

- Verify Firebase ID tokens on all authenticated routes.
- Distinguish listener routes from admin routes.
- Admin authorization must be based on server-controlled roles stored in Neon and/or verified Firebase custom claims. Never trust a role supplied in request JSON, query parameters, headers controlled by the caller, or browser local storage.
- Enforce role authorization in the Go API even if the admin UI hides buttons.
- Use a bootstrap command or protected one-time process to create the first super-admin; do not permit public self-registration as admin.
- Rate-limit login-adjacent, device-token, upload and admin endpoints.
- Validate request size, content type, file type and identifiers.

## 5.3 Initial REST API surface

Use `/api/v1` consistently. Final payloads must be documented in OpenAPI.

### Public endpoints

- `GET /api/v1/health` — health check without secrets.
- `GET /api/v1/app/config` — public remote configuration.
- `GET /api/v1/app/releases/latest?channel=stable&variant=...` — compatible update metadata.
- `GET /api/v1/announcements` — currently published announcements for app clients.
- `GET /api/v1/announcements/{id}` — announcement detail where required.

### Authenticated listener endpoints

- `GET /api/v1/me` — current profile.
- `PATCH /api/v1/me` — allowed profile fields.
- `DELETE /api/v1/me` — request account/data deletion.
- `GET /api/v1/me/library` — paginated cloud library.
- `POST /api/v1/me/library/sync` — idempotent sync batch or operations.
- `GET /api/v1/me/playlists` / `POST /api/v1/me/playlists`.
- `PATCH /api/v1/me/playlists/{id}` / `DELETE /api/v1/me/playlists/{id}`.
- `POST /api/v1/me/devices` — register/update FCM device token.
- `DELETE /api/v1/me/devices/{id}` — unregister device.
- `POST /api/v1/me/assets/avatar-upload` — create constrained avatar upload authorization.
- `POST /api/v1/me/assets/avatar-complete` — validate/commit upload.

### Admin endpoints

- `GET /api/v1/admin/dashboard`.
- `GET /api/v1/admin/users` and `GET /api/v1/admin/users/{id}`.
- `PATCH /api/v1/admin/users/{id}/status` — suspend/restore where policy permits.
- `GET/POST/PATCH /api/v1/admin/releases`.
- `POST /api/v1/admin/releases/{id}/upload-intent` — create a constrained R2 upload.
- `POST /api/v1/admin/releases/{id}/publish`.
- `POST /api/v1/admin/releases/{id}/archive`.
- `GET/POST/PATCH /api/v1/admin/announcements`.
- `POST /api/v1/admin/notifications/send` — send a notification based on a published announcement/release or approved payload.
- `GET/POST/PATCH /api/v1/admin/remote-config`.
- `GET/POST/PATCH /api/v1/admin/assets` — asset metadata and upload intents.
- `GET/POST/PATCH /api/v1/admin/admins` — manage admin roles, super-admin only.
- `GET /api/v1/admin/audit-logs`.

Use cursor or page-based pagination, consistent response envelopes, validation errors, and request correlation IDs. Do not expose raw database errors.

---

# 6. Neon PostgreSQL data model

Use Neon PostgreSQL as the persistent app database. Create versioned SQL migrations and test them against a clean database. Use Neon pooled connections for serverless/high-concurrency deployment where appropriate. All database access from production clients goes through the Go API.

## 6.1 Required tables

### `profiles`

- `id UUID PRIMARY KEY`.
- `firebase_uid TEXT UNIQUE NOT NULL`.
- `email TEXT` (nullable where provider/privacy settings do not provide it).
- `display_name TEXT`.
- `avatar_object_key TEXT` (R2 key, not a permanent signed URL).
- `status TEXT NOT NULL DEFAULT 'active'` (`active`, `suspended`, `deletion_pending`).
- `created_at`, `updated_at`, `last_seen_at TIMESTAMPTZ`.

### `user_preferences`

- `user_id UUID PRIMARY KEY REFERENCES profiles(id)`.
- `preferences JSONB NOT NULL DEFAULT '{}'` for an allowlisted versioned settings structure, or normalized child tables if the inspected settings model warrants it.
- `updated_at TIMESTAMPTZ`.

Do not store arbitrary executable config or unvalidated client JSON.

### `user_library_items`

- `id UUID PRIMARY KEY`.
- `user_id UUID NOT NULL REFERENCES profiles(id)`.
- `provider TEXT NOT NULL`.
- `provider_item_id TEXT NOT NULL`.
- `item_type TEXT` (track/album/artist as supported by the current app).
- Minimal metadata snapshot fields needed to render a saved item (title, artist, artwork reference/URL only where durable and permitted).
- `created_at`, `updated_at`, `deleted_at`.
- Unique constraint on `(user_id, provider, provider_item_id, item_type)` as appropriate.

Do not persist expiring stream URLs or proxy music audio through R2.

### `user_playlists`

- `id UUID PRIMARY KEY`.
- `user_id UUID NOT NULL REFERENCES profiles(id)`.
- `name TEXT NOT NULL`.
- `description TEXT`.
- `artwork_object_key TEXT` nullable.
- `is_public BOOLEAN NOT NULL DEFAULT FALSE` (default private; public sharing can remain disabled in V1).
- `created_at`, `updated_at`, `deleted_at`.

### `playlist_tracks`

- `id UUID PRIMARY KEY`.
- `playlist_id UUID NOT NULL REFERENCES user_playlists(id)`.
- `provider`, `provider_item_id`, metadata snapshot fields.
- `position INTEGER NOT NULL`.
- `created_at`, `updated_at`, `deleted_at`.
- Index `(playlist_id, position)`.

### `user_devices`

- `id UUID PRIMARY KEY`.
- `user_id UUID REFERENCES profiles(id)` (nullable only if supporting anonymous install-scoped notifications; otherwise require user).
- `installation_id TEXT NOT NULL`.
- `fcm_token TEXT NOT NULL` (treat as sensitive; do not log it).
- `platform TEXT NOT NULL DEFAULT 'android'`.
- `app_variant TEXT`.
- `notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE`.
- `last_seen_at`, `created_at`, `updated_at`.
- Unique/index strategy preventing duplicate active tokens.

### `app_releases`

- `id UUID PRIMARY KEY`.
- `package_name TEXT NOT NULL`.
- `version_code BIGINT NOT NULL`.
- `version_name TEXT NOT NULL`.
- `channel TEXT NOT NULL` (`stable`, `beta`, or a channel supported by the app).
- `variant TEXT` (GMS/FOSS/universal or exact variant naming discovered in the repository).
- `min_supported_version_code BIGINT`.
- `mandatory BOOLEAN NOT NULL DEFAULT FALSE`.
- `release_notes TEXT NOT NULL`.
- `r2_object_key TEXT NOT NULL`.
- `file_size BIGINT NOT NULL`.
- `sha256 TEXT NOT NULL`.
- `status TEXT NOT NULL` (`draft`, `published`, `archived`).
- `published_at`, `created_at`, `updated_at`.
- `created_by UUID REFERENCES profiles(id)` or a dedicated admin identity reference.
- Unique constraints preventing duplicate package/channel/variant/version releases.

### `announcements`

- `id UUID PRIMARY KEY`.
- `title TEXT NOT NULL`.
- `body TEXT NOT NULL`.
- `image_object_key TEXT` nullable.
- `target_platform TEXT` / `target_variant TEXT` nullable.
- `starts_at`, `ends_at` nullable.
- `status TEXT NOT NULL` (`draft`, `published`, `archived`).
- `created_by`, `created_at`, `updated_at`, `published_at`.

### `remote_config`

- `key TEXT PRIMARY KEY`.
- `value JSONB NOT NULL`.
- `description TEXT`.
- `public_to_app BOOLEAN NOT NULL DEFAULT FALSE`.
- `updated_by` and timestamps.

Expose only allowlisted public keys to Android. Never expose secrets.

### `admin_roles`

- `firebase_uid TEXT PRIMARY KEY` (or reference an admin profile table).
- `role TEXT NOT NULL` (`super_admin`, `release_manager`, `content_manager`, `moderator`, `support_readonly`).
- `created_by`, `created_at`, `updated_at`.

### `admin_audit_logs`

- `id UUID PRIMARY KEY`.
- `actor_firebase_uid TEXT NOT NULL`.
- `action TEXT NOT NULL`.
- `target_type TEXT`, `target_id TEXT`.
- `metadata JSONB` containing non-secret before/after summary where appropriate.
- `ip_hash` or privacy-conscious request context as approved.
- `created_at TIMESTAMPTZ NOT NULL`.

### Optional `listening_history`

Only implement if account-based history sync is part of the approved MVP. Make it opt-in, minimize collected fields, provide delete/export controls, and never use it for hidden user surveillance.

## 6.2 Database requirements

- Foreign keys, unique constraints and indexes for all common lookups.
- `TIMESTAMPTZ` stored in UTC.
- Parameterized queries only.
- Transactions for multi-row sync and release publishing.
- No public database port/credentials in Android or admin frontend.
- No hard deletes for syncable entities until retention/deletion semantics are clear; use tombstones where appropriate.
- Include seed/bootstrap scripts for initial local development, but never seed production with insecure default admin credentials.
- Provide `db migrate`, `db status`, and safe development reset commands.
- Include automated migration tests.

---

# 7. Cloudflare R2 object storage

Use Cloudflare R2's S3-compatible API from the Go backend. Keep bucket credentials exclusively on the backend.

## 7.1 Object categories

Use separate buckets or strict prefixes and policies for:

1. **Public images/assets:** announcement banners, admin-managed artwork, and optionally avatars if the product intentionally makes avatars public.
2. **Private release files:** APKs/build artifacts. These must not be anonymously listable or downloadable unless a deliberate public-release policy has been approved.

Suggested object keys:

```text
public/avatars/{user_uuid}/{random_id}.{ext}
public/announcements/{announcement_uuid}/{random_id}.{ext}
public/assets/{category}/{random_id}.{ext}
releases/{package}/{channel}/{variant}/{version_code}/{artifact_filename}.apk
```

Object keys must be generated/validated by the backend. Never use a user-supplied filename directly as the storage key.

## 7.2 Upload flow

1. Authenticated admin/client requests an upload intent from Go API.
2. Backend validates role, object category, maximum size, extension and MIME type.
3. Backend creates a random object key and a short-lived presigned PUT URL (or controlled upload endpoint for cases needing stronger scanning).
4. Client uploads directly to R2 using the short-lived URL.
5. Client calls completion endpoint.
6. Backend verifies object existence, size, metadata and expected checksum; for images, validate actual file format and dimensions.
7. Store object key and metadata in Neon.
8. For APKs, calculate/verify SHA-256 and store the verified artifact metadata before publishing.

Do not trust MIME type supplied by the browser alone. Add size limits and rate limits. Consider image re-encoding/resizing for public user-uploaded images.

## 7.3 Download flow

- Public images can use a configured public custom domain only if intended to be public.
- APKs use a short-lived presigned GET URL generated by the API after confirming the release is published and compatible.
- Do not persist presigned URLs in Postgres; they expire. Persist only the object key.
- Set correct content type and content disposition for APK downloads.
- Never expose R2 secret access keys in Android, admin JavaScript, source control or build logs.

## 7.4 Storage policy

R2 is not the music CDN and must not receive audio copied from music providers. The existing streaming implementation remains intact.

---

# 8. Firebase Authentication and administrator roles

## 8.1 Firebase project

Use one clearly documented Firebase project for Melo (separate dev/staging/prod projects if practical). Configure Android `google-services` only for compatible variants and configure Firebase Web SDK for the admin site.

The Firebase service account/Admin SDK credential belongs only in backend secret storage.

## 8.2 Listener auth

- Support guest playback.
- Let listeners sign in to sync cloud data and register notification devices.
- Account linking must not delete a guest's existing Room library.
- Sign-out must stop future account sync and disassociate or deactivate that account's device token according to product policy; it must not erase local music/downloads without explicit user action.
- Account deletion must remove or anonymize Neon account data and request Firebase Auth user deletion using a protected backend workflow. Explain any retained audit/security records.

## 8.3 Admin auth

- Admin panel sign-in through Firebase Auth.
- No public admin sign-up.
- Admin access requires both a valid Firebase ID token and an active server-side `admin_roles` record (or verified custom claim synchronized from the authoritative role store).
- Bootstrap the first super-admin via a one-time CLI command requiring an explicit Firebase UID/email confirmation.
- Super-admin can invite/assign admin roles; every change is audited.
- Enforce role permissions in the backend, not only in UI.

Suggested roles:

| Role | Permissions |
|---|---|
| `super_admin` | All actions, admin role management, release publication, config |
| `release_manager` | Create/upload/test/publish/archive releases and changelogs |
| `content_manager` | Manage announcements, banners and public assets |
| `moderator` | Review reports and suspend/restore users if user accounts are enabled |
| `support_readonly` | Read-only dashboard, release and user support views |

For initial launch, one or two trusted super-admins are sufficient. Do not over-engineer a complex staff workflow before the core release path works.

---

# 9. Firebase Cloud Messaging

The backend sends FCM messages using Firebase Admin SDK. The admin browser must never send FCM directly using privileged credentials.

## 9.1 Notification types

- `release_available` — new app version.
- `release_critical` — important update notice (actual mandatory behavior is independently enforced by release metadata at app startup/check time).
- `announcement` — admin-published announcement.
- `maintenance` — scheduled maintenance notice.

Payload should contain a type and stable ID, for example:

```json
{
  "type": "announcement",
  "announcement_id": "uuid",
  "deep_link": "melo://announcements/uuid"
}
```

Do not put private account details, secret values, or large content in FCM payloads. App fetches current content from API.

## 9.2 Sending rules

- Send to selected registered devices, supported app variants, or controlled topics where appropriate.
- Store FCM send result/summary and failures, but never log raw tokens.
- Handle invalid/unregistered tokens and deactivate them.
- Rate-limit and require confirmation for broadcasts to all users.
- Provide a test-send flow for admins.
- Record the initiator, audience, time, and result in audit logs.

---

# 10. App release and update management

This is a core admin-panel feature.

## 10.1 Admin release workflow

1. Admin opens **Releases** and creates a draft.
2. Enter package name, version code, version name, channel, supported variant/ABI, minimum supported version, optional/mandatory policy, and release notes.
3. Upload signed APK artifact to R2 using an upload intent.
4. Backend verifies size and SHA-256, records object key and artifact metadata.
5. Admin reviews the release summary and compatibility.
6. Release manager/super-admin publishes the release.
7. Publish transaction updates release state and audit log.
8. Optionally send FCM notification to the intended audience.
9. Android clients discover it through the public latest-release endpoint.

Do not allow a draft or archived release to be returned by the public update endpoint.

## 10.2 Release metadata

At minimum expose:

```json
{
  "release_id": "uuid",
  "package_name": "actual.package.name.from.repository",
  "version_code": 100,
  "version_name": "2.0.0",
  "channel": "stable",
  "variant": "actual-compatible-variant",
  "mandatory": false,
  "min_supported_version_code": 80,
  "release_notes": "Release notes...",
  "file_size": 12345678,
  "sha256": "hex-digest",
  "published_at": "2026-01-01T00:00:00Z"
}
```

Use actual values from the repository/build artifacts; examples above are illustrative only.

## 10.3 Compatibility rules

- Match package/application ID exactly.
- Match the Android build flavor/variant and ABI strategy discovered during audit.
- Do not offer an incompatible FOSS/GMS or architecture artifact.
- Enforce strictly increasing `version_code` for normal upgrades.
- Check minimum supported version and mandatory update policy.
- Validate APK SHA-256 on device after download.
- Preserve the existing package ID and release signing certificate if upgrading existing installations is required. The agent must document signing continuity and must never replace or regenerate a production signing key.
- If the signing key is unavailable, stop before publishing a release that claims in-place upgrade compatibility and clearly report the limitation.

## 10.4 Rollback semantics

Do not implement a misleading “downgrade installed app” button. Normal Android package manager restrictions generally prevent installing an older version code over a newer one. Admin rollback should:

- unpublish/disable a bad release from future update discovery; and
- repoint clients to a corrected forward version or a compatible artifact with a higher version code.

Record every release state transition.

---

# 11. Melo Admin web application

Build a separate responsive admin web application. It must be designed for desktop first but work on tablets and mobile browsers. Use a clean, polished, modern interface, consistent typography, restrained colors, excellent empty/loading/error states, and accessible controls. Avoid generic template-like UI.

## 11.1 Navigation

```text
Overview
Releases
  - All releases
  - Create release
  - Release channels
Announcements
Push notifications
Remote configuration
Assets
Users (only if listener accounts are enabled)
Administrators & roles
Audit logs
Settings
```

## 11.2 Screens and requirements

### A. Login

- Melo-branded sign-in page.
- Firebase Auth sign-in.
- Clear unauthorized-account state.
- No public sign-up link.
- Session expiry and sign-out.

### B. Dashboard

Display useful operational summaries:

- Latest stable version and publication date.
- Latest beta version.
- Draft releases awaiting review.
- Number of registered listener accounts (if account registration is enabled).
- Active devices/FCM registrations (clearly define the period and metric).
- Published announcements.
- Recent admin activity.
- Service health indicators based on backend health checks.

Do not invent user analytics. If a metric is not collected, show “Not available” rather than fabricate it.

### C. Releases

- Search/filter by channel, status, variant and version.
- Create/edit draft.
- Upload APK with progress.
- Validate package, version code, size and hash.
- Preview changelog.
- Publish, archive, or disable future discovery.
- Show artifact details and download URL status without exposing permanent credentials.
- Confirm irreversible/high-impact actions.

### D. Announcements

- Create/edit draft.
- Title, body, optional image, start/end dates, target app variant/channel.
- Preview how it appears in the app.
- Publish/archive.
- Option to notify supported devices after publishing.

### E. Push notifications

- Compose a notification tied to an existing release/announcement where possible.
- Choose audience (all eligible, stable, beta, specific supported variant, or test device).
- Show estimated eligible device count if available.
- Test send.
- Confirm broadcast.
- Show send results and errors.

### F. Remote configuration

- Show only allowlisted settings that the Android app actually understands.
- Typed controls (boolean, string, number, enum/JSON schema where needed).
- Preview and validation before publish.
- Version/update timestamp.
- Audit every mutation.
- Never expose secrets or arbitrary executable content.

### G. Assets

- Upload announcement banners and supported artwork.
- Preview, dimensions, file size and object key.
- Replace/delete with reference checks.
- No direct exposure of R2 credentials.

### H. Users (if listener accounts are enabled)

- Search by account ID/email/display name.
- View safe profile and account status.
- Suspend/restore with reason and confirmation.
- Process account deletion requests.
- Do not expose private listening history by default.

### I. Administrators and audit logs

- Assign/revoke roles (super-admin only for high-privilege role changes).
- Display last activity and role.
- Audit log filter by actor, action, target and date.
- Audit logs are append-only from application behavior; normal admins cannot edit them.

---

# 12. Security requirements — non-negotiable

- Neon connection strings, R2 access keys, Firebase service account keys and signing keys must never be committed to Git.
- Provide `.env.example` with placeholders only.
- Add secret scanning guidance and `.gitignore` entries for local secrets, keystores, service account JSON, `.env*` (except `.env.example`), build outputs and generated artifacts.
- Android app may contain public Firebase client configuration, but never Firebase Admin credentials, Neon credentials, R2 secret keys or admin API secrets.
- Admin browser must not connect to Neon with privileged credentials or R2 using secret keys.
- Verify Firebase ID tokens on the backend.
- Authorize every admin action on the backend.
- Derive user identity from verified tokens, not request payload.
- Use HTTPS in every deployed environment.
- Restrict CORS to approved admin/app origins where applicable.
- Rate-limit auth-adjacent, upload, notification and admin endpoints.
- Validate/escape user-generated content before rendering.
- Use secure cookies/session handling for admin app if using a server-managed session; do not store privileged secrets in localStorage.
- Protect against CSRF where cookie auth is used.
- Validate image content, dimensions and size; reject SVG or sanitize it before public use if needed.
- Validate APK type/size/hash and store privately.
- Keep audit records for admin actions and release publication.
- Do not log ID tokens, FCM tokens, passwords, signed URLs or secret environment values.
- Apply least privilege to database roles and R2 tokens.
- Define backup/restore and data-retention procedures.

---

# 13. Privacy and data minimization

The current Melo README describes the app as account-free/private and without central tracking. New cloud features must be transparent and minimal.

- Guest mode remains available.
- Explain what data syncs when a user signs in.
- Provide controls for account data and cloud-library deletion.
- Listening history sync is opt-in unless the user explicitly approves otherwise.
- Do not collect detailed playback telemetry just to inflate dashboard analytics.
- Provide a privacy policy update describing Firebase Auth, Neon, R2, FCM, account data and retention.
- Ensure account deletion removes/anonymizes associated profile, library, preferences and device records according to retention policy.
- Keep only minimal security/audit records where there is a documented lawful/operational reason.

---

# 14. Environment and configuration

Create `.env.example` for backend/admin with placeholder values only. Expected backend settings include:

```dotenv
APP_ENV=development
API_PORT=8080
PUBLIC_API_BASE_URL=http://localhost:8080
ADMIN_BASE_URL=http://localhost:3000

# Neon PostgreSQL
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

# Cloudflare R2 (S3-compatible)
R2_ACCOUNT_ID=replace-me
R2_ACCESS_KEY_ID=replace-me
R2_SECRET_ACCESS_KEY=replace-me
R2_BUCKET_PUBLIC_ASSETS=melo-public-assets
R2_BUCKET_RELEASES=melo-private-releases
R2_PUBLIC_ASSET_BASE_URL=https://assets.example.com

# Firebase Admin (use secure secret mount in production)
FIREBASE_PROJECT_ID=replace-me
FIREBASE_SERVICE_ACCOUNT_JSON_PATH=./secrets/firebase-service-account.json

# Security
CORS_ALLOWED_ORIGINS=http://localhost:3000
UPLOAD_URL_TTL_SECONDS=600
DOWNLOAD_URL_TTL_SECONDS=600
```

Admin frontend should receive only public configuration such as:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=replace-me
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=replace-me
NEXT_PUBLIC_FIREBASE_PROJECT_ID=replace-me
NEXT_PUBLIC_FIREBASE_APP_ID=replace-me
```

The public Firebase web config is not a service account secret; protect the backend secrets separately. Do not put Neon/R2 credentials in `NEXT_PUBLIC_*` variables.

Android configuration should use the repository's existing secure Gradle/local properties strategy for public API base URL and Firebase configuration. Do not hardcode development URLs in production builds.

---

# 15. Deployment architecture

Use independent deployables:

- **Neon:** managed PostgreSQL project with production and development branches/databases as practical.
- **Go API:** deploy to a reliable Go-capable host (container-based deployment preferred). Provide Dockerfile, health check, migration command and graceful shutdown.
- **Cloudflare R2:** buckets and scoped tokens configured outside source control.
- **Firebase:** Authentication and FCM project configuration; service account only on backend.
- **Admin:** deploy Next.js to a suitable host such as Vercel or Cloudflare-compatible hosting, with environment variables configured securely.
- **Android:** build signed APK variants via the repository's existing build process/CI; publish artifacts through the admin release workflow.

Provide:

- Development setup instructions.
- Staging deployment instructions.
- Production deployment checklist.
- Database migration/rollback procedure (rollback scripts only where safe; prefer forward migrations).
- R2 bucket setup and CORS configuration if direct presigned upload requires it.
- Firebase Android/Web app setup and SHA fingerprints where required.
- Admin first-super-admin bootstrap procedure.
- Secret rotation and incident response notes.

Do not deploy automatically to production or publish a real release without explicit user approval and valid credentials. Build and test locally using mocks/dev credentials first.

---

# 16. Testing strategy and acceptance criteria

## 16.1 Android regression

- App builds in every supported variant.
- Guest user can launch and play music without signing in.
- Search, browse, playback, queue, background playback, controls, lyrics, downloads and existing player settings remain functional.
- App works if backend is offline/unavailable.
- Account sign-in/out works in supported variants.
- Local library is not lost when a user signs in or signs out.
- Cloud sync works across two devices for the same account.
- Conflicts and offline queued writes are handled deterministically.
- FCM notifications work in supported GMS builds and no-GMS builds still compile/work without FCM.
- Update check filters by package/channel/variant/version correctly.
- APK download verifies SHA-256 and opens the Android installer flow.

## 16.2 Backend tests

- Firebase token verification accepts valid tokens and rejects expired/wrong-project/invalid tokens.
- Listener cannot access another user's profile/library.
- Non-admin cannot access `/admin/*`.
- Each admin role can perform only permitted actions.
- Invalid upload size/type is rejected.
- Presigned URLs expire and are scoped to one object/key/method.
- Release publication is transactional and audited.
- Draft/archived release is not exposed by public endpoint.
- R2 failure does not create a published release record.
- FCM invalid tokens are deactivated and not logged.
- Database migrations work on a clean Neon-compatible PostgreSQL database.

## 16.3 Admin UI tests

- Unauthorized Firebase account cannot enter the panel.
- Role-restricted pages/actions are hidden for UX and rejected by backend regardless.
- Release creation/upload/publish flow succeeds end-to-end in staging.
- Announcements can be drafted, previewed, published and archived.
- Test notification and broadcast confirmation work.
- Remote config validates supported keys/types.
- Upload progress, errors, empty states and loading states are usable.
- Audit log records administrative mutations.

## 16.4 Definition of done

The project is not complete merely because screens exist. It is complete when:

1. Existing music experience passes regression tests.
2. Firebase listener authentication works, with guest mode preserved.
3. Neon schema/migrations are implemented and tested.
4. User data can sync across devices without data loss.
5. R2 upload/download flows work securely.
6. Admin authentication and server-enforced roles work.
7. Admin can create and publish an app release.
8. Android detects a compatible release, downloads it, verifies it and invokes the installer.
9. Admin can publish an announcement and send FCM where supported.
10. Remote config can be fetched safely and does not block music playback.
11. Documentation, `.env.example`, OpenAPI, migrations and deployment instructions are complete.
12. No secrets are committed and all sensitive actions are audited.

---

# 17. Implementation phases — execute in this order

## Phase 0 — Repository audit and baseline

Clone/inspect the actual repository, build it untouched, map current architecture, check existing updater and identify integration points. Write `docs/implementation-audit.md`. Do not compare with old Melo/NomaTune or integrations that do not exist.

## Phase 1 — Backend foundation

Create Go API, configuration, logging, health endpoint, Firebase ID token verification, Neon connection, migration system, OpenAPI, Dockerfile and tests.

## Phase 2 — Neon schema and listener accounts

Implement profiles, preferences, library, playlists, device registrations and data access. Add Firebase Auth to Android with guest mode and account settings. Ensure local Room data remains intact.

## Phase 3 — Cloud sync

Implement offline-first sync, conflict handling, retries, local-to-cloud merge and multi-device tests.

## Phase 4 — Cloudflare R2

Create secure upload intents and completion validation for images and release APKs. Add signed downloads for private release artifacts. Store object keys/metadata in Neon.

## Phase 5 — Admin authentication and panel shell

Build Next.js admin app, Firebase login, protected routes, server-verified roles, dashboard shell and audit views.

## Phase 6 — Release management and Android updater integration

Build release lifecycle in backend/admin. Extend existing updater if present; otherwise add minimal update client. Test real APK signing/compatibility in a controlled environment.

## Phase 7 — Announcements, FCM and remote configuration

Admin content publishing, audience selection, FCM delivery, Android notification handling, safe remote config and cache/fallback behavior.

## Phase 8 — Hardening, regression and documentation

Run full tests, test all supported flavors, check privacy/security, perform staged release simulation, document deployment and prepare production checklist.

At every phase, keep the project buildable. Commit in coherent milestones if Git is configured. Never overwrite user changes or reset branches destructively.

---

# 18. Required deliverables

The coding agent must produce actual implementation files, not just a plan:

- Existing Android app with minimal, tested integrations.
- Go backend source and Dockerfile.
- Neon SQL migrations and seed/bootstrap scripts.
- R2 storage adapter and upload/download APIs.
- Firebase Auth integration for listener accounts and admin.
- FCM token registration and notification sender.
- Next.js admin panel.
- OpenAPI specification and API documentation.
- `.env.example` (placeholders only).
- `docs/implementation-audit.md`.
- `docs/architecture.md`.
- `docs/deployment.md`.
- `docs/operations.md`.
- Automated tests and a final test report.

Final report must clearly state:

- What was implemented.
- Which tests/build variants passed and failed.
- What requires user-provided credentials or external dashboard setup.
- Which environment variables need values.
- Any known limitation (especially FCM availability by build variant and Android APK installer confirmation).
- Exact commands to run Android, backend and admin locally.

---

# 19. Final command to the coding agent

Read this entire PRD. Start by cloning or inspecting **only** `https://github.com/techxsarwar/melo.git` as the Android foundation. This repository is the modified Melo app supplied by the user's colleague.

The task is to **add** Neon PostgreSQL, Cloudflare R2, Firebase Authentication, Firebase Cloud Messaging, a secure Go backend, and a separate Melo Admin web panel. These integrations are to be built now; do not assume they already exist.

Inspect the existing Android code solely to understand its actual architecture and where the new functionality belongs. Preserve the current app and its music features. Do not migrate to another music app repository, do not rebuild the player, do not redesign the existing interface, and do not route music playback through the new backend or R2.

Keep guest playback working. Add account/cloud features as an additive capability. Build the admin release workflow so authorized admins can upload and publish signed APK releases, manage update policy, publish announcements, configure supported remote settings, and send FCM notifications where supported.

Implement in phases, test the real flows, keep documentation current, and report blockers honestly. Never claim an integration is complete when it is only scaffolded or mocked.
