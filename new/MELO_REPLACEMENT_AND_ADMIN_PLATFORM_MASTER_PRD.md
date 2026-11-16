# MELO — REPLACEMENT, CLOUD INTEGRATION & ADMIN PLATFORM

**Master Product Requirements Document (PRD) for the coding agent**  
**Project:** Melo Android + Melo Backend + Melo Admin  
**Document status:** Implementation specification  
**Primary Android source of truth:** `https://github.com/techxsarwar/melo.git`  
**Backend:** Go  
**Database:** Existing Neon PostgreSQL project  
**Object storage:** Existing Cloudflare R2 account/bucket  
**Authentication:** Existing Firebase project / Firebase Authentication  
**Push notifications:** Existing Firebase project / Firebase Cloud Messaging (FCM)  
**Admin web application:** Next.js + TypeScript

---

## 0. EXECUTIVE SUMMARY — READ THIS FIRST

We are replacing the old Melo Android source code currently in the development workspace with a newer, already-modified Melo Android application developed by another team member.

The new Android source is:

`https://github.com/techxsarwar/melo.git`

The colleague has already done the Android music-app modification work. The coding agent must use this repository as the **only Android application foundation** going forward.

The agent's job is to:

1. Safely back up the old working workspace and locate the previously supplied Firebase, Neon and Cloudflare configuration values.
2. Clone the new `techxsarwar/melo` repository into a clean temporary location.
3. Thoroughly inspect the new repository and build it without modifications.
4. Replace the old Android source in the active workspace with the new source after backup and successful verification.
5. Connect the new app and backend to the existing Firebase project, existing Neon PostgreSQL database, and existing Cloudflare R2 bucket.
6. Build a Go backend API that securely connects the mobile application, Neon, R2 and Firebase.
7. Build a separate, production-quality Next.js administration dashboard.
8. Integrate the minimum Android-side functionality required for user accounts/cloud data (where required), device registration, remote configuration, announcements and administrator-managed app updates.
9. Preserve all existing music functionality, visual design and playback behavior in the new Android repository.

### 0.1 Non-negotiable direction

- **Do not continue developing the old Android app.** It is being replaced.
- **Do not use NomaTune.** The source of truth is `techxsarwar/melo`.
- **Do not rebuild the music player.** The colleague-modified app is the foundation.
- **Do not redesign the existing Android UI without an explicit requirement.** Preserve the screens and interactions that already exist.
- **Do not assume Firebase, Neon or R2 have already been integrated into the new repository.** They are infrastructure to connect now. The old workspace may contain credentials/configuration and any preliminary backend work.
- **Do not create new Firebase projects, Neon projects/databases or R2 buckets unless the existing resource is unusable and the project owner explicitly approves creating a replacement.** Reuse the existing resources.
- **Do not delete cloud resources, database contents, buckets, service accounts or credentials.** The old local Android source may be replaced; the cloud infrastructure must be retained.
- **Do not display, print, commit or paste secrets into source files.**
- **Do not claim a feature works until it has been built and tested.**

### 0.2 Existing resource handling in one sentence

Preserve and reuse the Firebase project, Neon database, Cloudflare account/bucket and valid credentials previously configured in the old workspace; remove the old Android source only after backup and successful verification of the new source.

---

## 1. PRODUCT VISION AND SCOPE

### 1.1 Product vision

Melo remains a music application. The new backend and admin dashboard provide centralized operational control, secure account capabilities, cloud-backed app data, asset storage, notifications and release management.

The user-facing music experience must remain familiar to users of the modified app. Cloud functionality should be added around the app rather than used as a reason to rewrite its music architecture.

### 1.2 In-scope deliverables

**A. Android source replacement and integration**
- Clone and adopt the colleague-modified Melo Android repository.
- Preserve existing music discovery, search, playback, queues, library, downloads, lyrics, player customization and all other capabilities found in the new source.
- Add Firebase Authentication integration if user sign-in/account sync is in scope and not already present.
- Add device registration and FCM integration for supported build variants.
- Add backend API client and secure token handling.
- Add cloud sync for account-owned user data if implemented in the existing app and approved by the audit: profiles, preferences, liked/saved items, playlists and other supported library data.
- Add remote configuration, announcements and update checks without duplicating a functioning updater.

**B. Go backend**
- Authentication middleware that verifies Firebase ID tokens.
- Neon PostgreSQL data access and migrations.
- Cloudflare R2 integration using the S3-compatible API.
- Admin authorization and role-based permissions.
- Release metadata, artifact upload/signing checks, publishing and rollback.
- Announcements and FCM delivery.
- Remote configuration.
- Device registration and app-version reporting.
- Asset management.
- User profile/cloud data APIs where required.
- Audit logging.

**C. Admin web dashboard**
- Secure admin sign-in using the existing Firebase project.
- Overview dashboard.
- User/device management (limited to operational needs and privacy policy).
- APK release management.
- Stable/beta channels and release notes.
- Optional/mandatory update controls.
- Announcements and push notification campaigns.
- Remote configuration/feature flags.
- Image/asset management backed by R2.
- Admin role management and audit logs.

**D. Operations and quality**
- Database migrations and seed/bootstrap process.
- Environment variable templates with no real secrets.
- Deployment documentation.
- Backup and restore documentation.
- Automated tests and release checklist.

### 1.3 Explicitly out of scope unless separately approved

- Rewriting the music provider/extraction layer.
- Replacing the audio engine or player architecture.
- Copying NomaTune code/features into the project.
- Creating a new social network, community feed or chat system.
- Replacing existing music providers.
- Storing or proxying copyrighted music files in R2.
- Building an independent music streaming backend.
- Automatically installing APKs without Android's normal user confirmation.
- Requiring a login before a user can try basic music playback.
- Replacing the existing app's visual system with a new design system.

---

## 2. SOURCE REPLACEMENT AND WORKSPACE MIGRATION

This is the first major task. Do it carefully and in order. The agent must not immediately delete the old workspace.

### 2.1 Workspace discovery

Inspect the current workspace and identify:
- The existing/old Melo Android project directory.
- Root Git repository and all remotes/branches.
- Uncommitted and untracked changes.
- Existing backend projects, if any.
- Existing SQL migration files, schema snapshots and seed files.
- Firebase client configuration files and project identifiers.
- Firebase Admin/service-account credential location (if present).
- Cloudflare account ID, R2 endpoint, bucket name and R2 API credentials.
- Neon project/database identifiers and connection string(s).
- Existing `.env` files, secret stores and deployment configuration.
- Signing keystore files, aliases, certificates and passwords, if present.
- Existing update implementation and release metadata.
- Existing docs, product requirements and API contracts.

Do not print secret values. Create a redacted inventory with variable names and status only, for example `R2_ACCESS_KEY_ID: present`, never the value.

### 2.2 Backup before replacement

Before any destructive action:
1. Create a timestamped backup of the entire old workspace outside the active project directory.
2. Include source code, Git metadata, environment files, local configuration, migrations, deployment files and signing materials that the developer is authorized to preserve.
3. Protect the backup with appropriate filesystem permissions. Do not add it to the new Git repository.
4. Verify that the backup exists and that key files can be read.
5. Record the original repository remote, commit, branch and working-tree state.
6. Ensure the backup is not stored in a public or automatically synced directory.

Do not upload secrets or the backup to a public repository or third-party service.

### 2.3 Clone the new repository

Clone into a clean temporary directory first:

```bash
git clone https://github.com/techxsarwar/melo.git melo-new-source
cd melo-new-source
git status --short
git log -1 --oneline
```

If Git is unavailable, use the GitHub source ZIP as a fallback, but preserve the repository URL, branch, commit SHA and retrieval date in the audit report.

Inspect the actual default branch and repository state. Do not rely on package names, module names, version numbers or build variants quoted in old conversation notes. Read the current files from the clone and record their actual values.

Inspect at minimum:
- `README` and contribution/build documentation.
- `settings.gradle` / `settings.gradle.kts`.
- Root and module Gradle build files.
- Version catalogs.
- Gradle wrapper and Java/Kotlin/Android Gradle Plugin requirements.
- All Android modules and source sets.
- Manifests and product flavors/build variants.
- Firebase configuration files, if any, and whether they belong to the correct project/package.
- Existing update checker/release implementation, if any.
- Existing networking, local database and dependency-injection architecture.
- Existing package/application ID, namespace, version name/code and signing configuration.
- Existing permissions, backup rules and network security settings.
- Existing license and third-party notices.

### 2.4 Build the untouched clone

Before adding dependencies or changing source:
- Set up the JDK/Android SDK required by the repository.
- Use the repository's Gradle wrapper.
- Sync Gradle.
- Build all relevant variants that can be built in the environment.
- Run available unit tests and lint checks.
- Install/run at least one supported build variant on an emulator/device if available.
- Test core navigation and music playback manually where possible.

Record successful and failed tasks. If the untouched clone does not build, diagnose whether the failure is an environment prerequisite, external service dependency, source defect or repository configuration issue. Do not hide the failure by making unrelated changes.

### 2.5 Determine app identity and update compatibility

Compare the old published Melo installation identity with the new repository's identity. Inspect:
- `applicationId` for each relevant build variant.
- Signing certificate SHA-256 fingerprints.
- Old release keystore availability and ownership.
- New repository signing configuration.
- Existing users' installed package identity.
- Current version code/name and proposed next version code.

A normal in-place Android update requires compatible package identity and signing lineage/certificate and a higher version code. If any of these differ, document that the replacement will install as a separate app or requires an approved identity/signing migration. Do not silently change package identity or signing keys. Do not lose the old release signing key.

The package and version details must come from the live clone and current old release artifacts, not from assumptions.

### 2.6 Replace the old active source

Only after backup and a successful untouched build:
1. Choose a clear final workspace structure.
2. Make the cloned repository the active Android project.
3. Remove the old Android source from the active workspace as requested.
4. Retain the verified backup outside the active project.
5. Retain/copy forward only the relevant cloud configuration, backend code, SQL migrations, docs and signing configuration that is intentionally reused.
6. Never copy an old Android implementation over the new Android source.
7. Preserve the new repository's Git history and keep its upstream attribution/license files.
8. If the final workspace becomes a monorepo, establish a clean root Git repository or a clearly documented arrangement; do not accidentally nest unrelated Git repositories.
9. Do not push to GitHub or delete any remote repository unless explicitly authorized.

Suggested final workspace layout (adapt to the cloned project without damaging its Gradle structure):

```text
melo-workspace/
├── android/                 # cloned colleague-modified Melo Android app
├── backend/                 # Go API
├── admin/                   # Next.js admin dashboard
├── infra/
│   ├── db/migrations/       # SQL migrations
│   ├── db/seeds/            # non-secret development seed data
│   └── deployment/          # deployment configuration/docs
├── docs/
│   ├── architecture.md
│   ├── repository-audit.md
│   ├── credentials-inventory.redacted.md
│   ├── database.md
│   ├── api.md
│   ├── deployment.md
│   ├── release-process.md
│   └── operations-runbook.md
├── .gitignore
└── README.md
```

If a monorepo layout would require unnecessary movement of the Android build files, keep Android at the root and create `backend/`, `admin/`, `infra/` and `docs/` beside it instead.

### 2.7 Reuse existing credentials safely

The agent is expected to locate the Firebase, Neon and Cloudflare credentials previously supplied in the old workspace or secure environment.

- Reuse valid values without printing them.
- Copy only the required configuration into the new workspace's secure environment files or secret manager.
- Do not commit `.env`, JSON service-account keys, private keystores or secret files.
- Update `.gitignore` and secret scanning configuration before the first commit.
- If a credential cannot be found, report the exact missing variable name and request it. Do not invent it or create a new cloud resource as a workaround.
- If any secret was previously committed or exposed, flag it and request approval to rotate it; do not rotate silently.

Example environment variable names (adapt as needed, do not store values in documentation):

```dotenv
# Backend core
APP_ENV=
API_BASE_URL=
PORT=
LOG_LEVEL=

# Neon PostgreSQL
DATABASE_URL=
DATABASE_MIGRATION_URL=

# Cloudflare R2 (S3-compatible API)
R2_ACCOUNT_ID=
R2_BUCKET_NAME=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_ASSET_BASE_URL=

# Firebase Admin / project
FIREBASE_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=
# Or use workload identity / platform secret integration where supported.

# Admin web
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase web client configuration values exposed through `NEXT_PUBLIC_` are client configuration, not Admin SDK secrets. Private service-account credentials must remain server-side.

---

## 3. PRODUCT USERS AND AUTHENTICATION MODEL

### 3.1 Roles

**Listener (Android user)**
- Can use the existing music app in guest mode.
- Can optionally create/sign into a Melo account if account sync is delivered.
- Can manage their own profile, preferences, devices and cloud-backed library data.
- Can opt in/out of non-essential push notifications.
- Cannot access administrative endpoints.

**Super Admin**
- Full admin dashboard access.
- Can manage admins, releases, announcements, remote configuration and assets.
- Can view audit logs.

**Release Manager**
- Can create, upload, validate, publish, pause and roll back releases.
- Cannot manage super-admin accounts unless separately granted.

**Content/Notification Manager**
- Can manage announcements, notification campaigns, banners and allowed assets.
- Cannot publish app releases unless separately granted.

**Support/Moderator (optional)**
- Can view limited user/device information and handle reports/support workflows if those are enabled.
- Cannot view passwords, private tokens or secret values.

### 3.2 Firebase Authentication

Use the existing Firebase project and Firebase Authentication provider configuration. Do not create a replacement project.

Android:
- Integrate Firebase Authentication through the Android SDK and the providers enabled in the existing Firebase project.
- Support email/password and/or Google sign-in only where enabled and configured by the project owner.
- Keep guest mode available so playback is not blocked by account creation.
- When a user signs in, obtain a Firebase ID token and send it to the Go API over HTTPS as a bearer token.
- Never send Firebase passwords to the Go API or store them in Neon.
- Handle expired tokens by refreshing through the Firebase client SDK.
- On logout, clear local account/session-specific state and FCM registration association as appropriate, without deleting guest music data unexpectedly.

Admin dashboard:
- Use Firebase Web Authentication against the same Firebase project.
- Do not allow public self-registration to create an administrator.
- Admin status must be granted through a controlled bootstrap process and stored server-side.
- Use secure session handling appropriate to Next.js. Protect server routes and API calls.

Go backend:
- Verify every Firebase ID token before trusting the UID.
- Verify token signature, issuer, audience/project ID, expiry and other required claims using Firebase Admin SDK or the documented verification process.
- Never trust a UID supplied in request JSON or query parameters as the authenticated identity.
- For admin endpoints, additionally check the UID against the `admin_roles` table and the requested permission.
- Do not treat a Firebase login alone as admin authorization.

**Go version note:** the Firebase Admin Go SDK documentation current at this PRD's preparation date lists Go 1.26 or higher as a requirement. Verify the current SDK release compatibility at implementation time and pin a compatible Go toolchain in `go.mod` and CI. If the deployment environment cannot run the required Go version, use the Firebase-supported FCM HTTP v1 approach and a correctly implemented ID-token/JWT verification method rather than adding an unsupported SDK version.

### 3.3 User account and cloud sync scope

Implement cloud sync only for data that already exists in or is intentionally added to the new modified app. Do not create duplicate library systems.

Recommended initial synced data:
- User profile and avatar object key.
- User preferences (theme, language and other app preferences that are safe to synchronize).
- Liked/saved track identifiers and source metadata.
- User-created playlists and playlist ordering.
- Followed artists/albums if represented in the app.
- Optional listening history only with clear disclosure and user control.

Rules:
- Preserve local-first playback and library behavior.
- Guest data stays local until the user chooses to sign in.
- On first sign-in, offer a safe merge of eligible local data with cloud data.
- Make sync idempotent and conflict-aware.
- Use stable music-provider IDs and metadata only. Never store expiring stream URLs as durable track identity.
- Do not upload/store copyrighted audio files or downloaded music to R2/Neon.
- Users can request account deletion and deletion of associated cloud data according to the product's retention policy.
- If account sync cannot be safely added without large changes to the new app, deliver authentication/device registration first, document the limitation and do not disrupt local music usage.

---

## 4. SYSTEM ARCHITECTURE

### 4.1 High-level architecture

```text
┌──────────────────────────────────┐
│         Melo Android App         │
│ Existing music app + minimal      │
│ auth/device/update/config hooks   │
└────────────────┬─────────────────┘
                 │ HTTPS + Firebase ID token
                 ▼
┌──────────────────────────────────┐
│          Melo Go API             │
│ Auth middleware · RBAC · API     │
│ Releases · Assets · User data    │
│ Announcements · Remote config    │
│ FCM sender · Audit logging       │
└───────┬────────────┬─────────────┘
        │            │
        ▼            ▼
┌──────────────┐  ┌────────────────┐
│ Neon         │  │ Cloudflare R2  │
│ PostgreSQL   │  │ S3-compatible  │
│ metadata     │  │ objects        │
└──────────────┘  └────────────────┘
        ▲
        │ HTTPS / authenticated admin API
┌───────┴──────────────────────────┐
│       Melo Admin (Next.js)       │
│ Firebase login · management UI  │
└──────────────────────────────────┘

Firebase Authentication: identity provider for Android users and admins.
Firebase Cloud Messaging: push transport for supported Android variants.
```

### 4.2 Technology choices

| Layer | Required technology | Notes |
|---|---|---|
| Android | Existing modified Melo codebase | Preserve framework and module architecture found in clone |
| Backend | Go | REST API, validation, auth, data and admin operations |
| PostgreSQL | Existing Neon database | SSL, pooled runtime connection, separate migration connection where needed |
| Database access | `pgx`/`database/sql` + SQL migrations; `sqlc` optional | Prefer explicit SQL and typed access; avoid unnecessary ORM rewrite |
| Object storage | Existing Cloudflare R2 | S3-compatible API; presigned URLs for controlled uploads/downloads |
| Authentication | Existing Firebase Authentication | Android and Next.js clients; Go verifies ID tokens |
| Push | Existing Firebase Cloud Messaging | Sent from trusted backend/admin workflow |
| Admin | Next.js + TypeScript | Responsive, accessible admin dashboard |
| UI | Tailwind CSS + shadcn/ui (or existing approved UI kit) | Consistent components, real forms and data tables |
| Validation | Go validation + Zod on Next.js | Validate on server even when client validates |
| API documentation | OpenAPI 3.1 | Keep API specification in repository |
| Migrations | Versioned SQL (Goose or equivalent) | Never apply destructive schema changes without explicit review |
| Deployment | Document and configure chosen hosting providers | Do not assume credentials/platform access exist |

### 4.3 Architecture rules

- Android talks to the Go API for application-owned data and administrative configuration. Android must not connect directly to Neon.
- Admin browser talks to the Go API for privileged operations. It must not connect directly to Neon or R2 using secret credentials.
- Go API is the only component with Neon runtime credentials and R2 secret credentials.
- Firebase client SDKs authenticate users; the backend verifies their ID tokens.
- FCM messages are sent from the trusted Go backend, not directly from Android/admin browser using server credentials.
- R2 stores binary objects; Neon stores metadata, ownership and references.
- Do not use R2 as a music streaming proxy or host copyrighted music files.
- All production service-to-service communication uses TLS/HTTPS.

---

## 5. GO BACKEND REQUIREMENTS

### 5.1 Service structure

Use a maintainable modular structure such as:

```text
backend/
├── cmd/api/main.go
├── internal/
│   ├── config/
│   ├── httpserver/
│   ├── middleware/
│   │   ├── firebaseauth/
│   │   ├── adminrbac/
│   │   ├── ratelimit/
│   │   └── requestid/
│   ├── handlers/
│   ├── services/
│   ├── repositories/
│   ├── database/
│   ├── firebase/
│   ├── r2/
│   ├── releases/
│   ├── notifications/
│   ├── remoteconfig/
│   ├── users/
│   └── audit/
├── migrations/
├── openapi/
├── tests/
├── go.mod
├── go.sum
├── Dockerfile
└── README.md
```

Adapt to the actual project; don't generate unnecessary abstractions.

### 5.2 Core backend requirements

- Configuration is loaded from environment variables/secrets.
- Validate required configuration at startup and fail clearly if a mandatory variable is missing.
- Structured JSON logs with request IDs; do not log credentials, tokens, FCM tokens, signed URLs or private user data.
- Graceful shutdown and context cancellation.
- Request body size limits.
- Input validation and strict JSON decoding.
- Rate limits on sign-in-adjacent endpoints, upload URL creation, update checks and admin mutation endpoints.
- CORS allowlist for the admin origin; never wildcard privileged production access.
- Secure HTTP headers and TLS at the edge/load balancer.
- Health endpoints that do not expose environment/configuration details.
- Database transactions for multi-step state changes.
- Consistent error response format.
- Pagination for list endpoints.
- Idempotency for operations that may be retried (publish release, send notification campaign, sync operations).
- Audit log for privileged changes.

### 5.3 API conventions

Base path: `/api/v1`

Response envelope (unless streaming or binary):

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Error envelope:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid",
    "details": {}
  }
}
```

Use suitable HTTP status codes. Never return database stack traces or internal secrets.

### 5.4 Public/app endpoints

Implement only the endpoints needed by the app and document them in OpenAPI.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health/live` | Liveness check |
| GET | `/health/ready` | Readiness check including dependency availability without leaking secrets |
| GET | `/api/v1/app/config` | Public, versioned remote configuration |
| GET | `/api/v1/app/releases/latest` | Latest release compatible with platform/channel/variant/current version |
| GET | `/api/v1/app/announcements` | Active announcements for the app |
| POST | `/api/v1/devices/register` | Register/update current device and installation |
| DELETE | `/api/v1/devices/current` | Remove current device association |
| GET | `/api/v1/me` | Current authenticated user's profile |
| PATCH | `/api/v1/me` | Update allowed profile fields |
| DELETE | `/api/v1/me` | Account/data deletion request workflow |
| GET | `/api/v1/me/library` | Fetch cloud-synced library data if enabled |
| PUT | `/api/v1/me/library` | Idempotent sync/upsert of supported library data |
| GET | `/api/v1/me/preferences` | Get synchronized preferences |
| PUT | `/api/v1/me/preferences` | Update preferences |
| POST | `/api/v1/uploads/avatar` | Create authorized avatar upload intent |
| POST | `/api/v1/uploads/complete` | Verify uploaded object and commit metadata |

Public endpoints must only return information intentionally public to unauthenticated app clients. User endpoints require Firebase ID-token authentication.

### 5.5 Admin endpoints

All `/api/v1/admin/*` endpoints require a valid Firebase ID token and an active admin role/permission.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/admin/overview` | Dashboard statistics |
| GET/POST | `/api/v1/admin/releases` | List/create release drafts |
| GET/PATCH/DELETE | `/api/v1/admin/releases/{id}` | Manage release draft metadata |
| POST | `/api/v1/admin/releases/{id}/artifacts/upload-url` | Create presigned R2 upload URL |
| POST | `/api/v1/admin/releases/{id}/artifacts/complete` | Verify uploaded artifact/checksum/size |
| POST | `/api/v1/admin/releases/{id}/validate` | Validate release and artifacts |
| POST | `/api/v1/admin/releases/{id}/publish` | Publish a release |
| POST | `/api/v1/admin/releases/{id}/pause` | Pause rollout |
| POST | `/api/v1/admin/releases/{id}/rollback` | Mark an approved previous release as current |
| GET/POST | `/api/v1/admin/announcements` | Manage announcements |
| PATCH/DELETE | `/api/v1/admin/announcements/{id}` | Edit/archive announcement |
| POST | `/api/v1/admin/notifications/campaigns` | Create FCM campaign |
| POST | `/api/v1/admin/notifications/campaigns/{id}/send` | Validate and send campaign |
| GET | `/api/v1/admin/notifications/campaigns/{id}` | View campaign status/results |
| GET/PUT | `/api/v1/admin/remote-config` | Read/update remote configuration |
| GET/POST | `/api/v1/admin/assets` | List/create asset metadata and upload intents |
| DELETE | `/api/v1/admin/assets/{id}` | Delete or archive an asset and its R2 object |
| GET | `/api/v1/admin/users` | Search/list limited user profiles |
| GET | `/api/v1/admin/users/{id}` | View authorized user summary |
| PATCH | `/api/v1/admin/users/{id}/status` | Suspend/restore account if policy permits |
| GET | `/api/v1/admin/devices` | Search app installations/devices |
| GET | `/api/v1/admin/roles` | List admin roles |
| POST/PATCH/DELETE | `/api/v1/admin/roles` | Manage admins (super-admin only) |
| GET | `/api/v1/admin/audit-logs` | Search audit history |

Do not expose destructive endpoints to roles without permission. Use explicit confirmation and audit events for publishing, rollback, user suspension, data deletion and object deletion.

---

## 6. NEON POSTGRESQL DATABASE

### 6.1 Resource rules

- Reuse the existing Neon project and database configured in the old workspace.
- Do not create a new Neon project or database by default.
- Do not reset, truncate, drop or overwrite existing data.
- Inspect existing schemas before writing migrations.
- Record current database name, branch and migration state without printing credentials.
- Use TLS/SSL.
- Use Neon pooled connection for normal API runtime where appropriate; use a direct connection for migration/administrative workflows if required by the chosen tooling.
- Keep connection strings server-side only.
- Apply versioned SQL migrations with an explicit migration table.
- Back up or verify point-in-time recovery/backup availability before production schema changes.

### 6.2 Required initial tables

The agent must inspect any existing schema and adapt migrations to avoid duplicates. Suggested logical tables:

**`profiles`**
- `id` UUID primary key.
- `firebase_uid` TEXT unique not null.
- `username` CITEXT or normalized TEXT unique where appropriate.
- `display_name` TEXT.
- `avatar_asset_id` UUID nullable.
- `bio` TEXT nullable with length limit.
- `status` TEXT enum/check (`active`, `suspended`, `deletion_pending`, `deleted`).
- `created_at`, `updated_at`, `deleted_at`.

**`user_preferences`**
- `user_id` UUID primary key/FK.
- `preferences` JSONB with server-side allowlist/schema validation.
- `updated_at` and `version`.

**`user_devices`**
- `id` UUID.
- `user_id` UUID nullable for guest installation, later linked to account.
- `installation_id` TEXT unique.
- `firebase_installation_id` TEXT nullable if using FID flows.
- `fcm_token` TEXT nullable; treat as sensitive operational data.
- `platform` TEXT (`android`).
- `app_variant` TEXT (actual variants discovered from repository).
- `package_name` TEXT.
- `version_code` BIGINT.
- `version_name` TEXT.
- `abi` TEXT nullable.
- `last_seen_at`, `created_at`, `updated_at`, `revoked_at`.

**`user_library_items`** (only if cloud library sync is enabled)
- `id` UUID.
- `user_id` UUID FK.
- `provider` TEXT.
- `provider_item_id` TEXT.
- `item_type` TEXT (`track`, `album`, `artist`, etc.).
- `metadata` JSONB limited to safe display metadata.
- `is_liked` BOOLEAN.
- `added_at`, `updated_at`.
- Unique key on user/provider/type/provider_item_id.
- Never store playable stream URLs.

**`user_playlists`** and **`user_playlist_items`** (only if supported by app)
- Playlist owner, title, description, visibility, artwork reference, sort order, source IDs and timestamps.
- Validate item ownership and access.
- Do not store audio bytes.

**`admin_roles`**
- `firebase_uid` TEXT unique.
- `role` TEXT (`super_admin`, `release_manager`, `content_manager`, `support`).
- `permissions` JSONB only if necessary; prefer role mapping in code.
- `is_active`, `created_at`, `updated_at`, `created_by`.
- Never allow the browser to self-assign roles.

**`app_releases`**
- `id` UUID.
- `version_name` TEXT.
- `version_code` BIGINT.
- `channel` TEXT (`stable`, `beta`, optional `nightly`).
- `platform` TEXT (`android`).
- `status` TEXT (`draft`, `uploaded`, `validated`, `scheduled`, `published`, `paused`, `superseded`, `withdrawn`).
- `release_notes` JSONB or Markdown with sanitization.
- `is_mandatory` BOOLEAN.
- `minimum_supported_version_code` BIGINT nullable.
- `rollout_percentage` SMALLINT 0–100.
- `available_from`, `published_at`, `created_at`, `updated_at`.
- `created_by`, `published_by` Firebase UIDs.

**`release_artifacts`**
- `id` UUID.
- `release_id` UUID FK.
- `variant` TEXT.
- `abi` TEXT nullable.
- `package_name` TEXT.
- `object_key` TEXT unique.
- `file_name` TEXT.
- `content_type` TEXT.
- `size_bytes` BIGINT.
- `sha256` TEXT.
- `signing_cert_sha256` TEXT.
- `created_at`.

**`announcements`**
- `id` UUID.
- `title`, `body`, `type`, `status`.
- `targeting` JSONB validated against allowlisted targeting fields.
- `starts_at`, `ends_at`.
- `image_asset_id` UUID nullable.
- `created_by`, `published_at`, timestamps.

**`notification_campaigns`**
- `id` UUID.
- `title`, `body`, `data_payload` JSONB with strict limits.
- `target_type` (`all`, `app_version`, `channel`, `selected_devices`, `topic` only if controlled).
- `targeting` JSONB.
- `status` (`draft`, `scheduled`, `sending`, `sent`, `partial`, `failed`, `cancelled`).
- `scheduled_at`, `sent_at`, `created_by`, timestamps.
- Do not log raw FCM tokens in delivery logs.

**`notification_deliveries`** (if delivery-level tracking is needed)
- Campaign ID, device ID or hashed target reference, result code, provider message ID, timestamp.
- Apply retention limits.

**`remote_config`**
- `key` TEXT primary key.
- `value` JSONB.
- `value_type` TEXT.
- `description` TEXT.
- `enabled` BOOLEAN.
- `minimum_app_version_code` BIGINT nullable.
- `channel` TEXT nullable.
- `updated_by`, `updated_at`, `version`.

**`assets`**
- `id` UUID.
- `object_key` TEXT unique.
- `bucket` TEXT (or configured bucket reference).
- `asset_type` TEXT (`avatar`, `banner`, `release`, `other`).
- `file_name`, `content_type`, `size_bytes`, `sha256`.
- `visibility` (`public`, `private`).
- `owner_uid` TEXT nullable.
- `created_by`, timestamps, `deleted_at`.

**`admin_audit_logs`**
- `id` UUID.
- `actor_firebase_uid` TEXT.
- `action` TEXT.
- `resource_type`, `resource_id`.
- `before_state` JSONB and `after_state` JSONB with secrets/private fields redacted.
- `ip_hash` or privacy-reviewed IP handling.
- `user_agent` truncated/normalized.
- `request_id`, `created_at`.
- Append-only for normal admin operations; no UI delete button.

Add indexes, foreign keys, uniqueness rules, check constraints and appropriate delete behavior.

### 6.3 Database security

- Use parameterized queries only.
- Do not expose Neon directly to Android or browser.
- Use separate least-privilege database roles for runtime and migrations where feasible.
- Do not use database superuser credentials for routine API traffic.
- Validate JSONB fields against explicit schemas and size limits.
- Use transactions when mutating release state and publishing campaigns.
- Restrict user queries by verified Firebase UID mapped to `profiles.firebase_uid`.
- Admin access is enforced in the API, not in UI visibility.
- Decide and document retention/deletion rules for devices, FCM tokens, audit logs and listening data.

---

## 7. CLOUDFLARE R2 OBJECT STORAGE

### 7.1 Resource reuse

Use the existing Cloudflare account and existing R2 bucket from the old workspace.

- Do not create a replacement bucket unless approved.
- Verify endpoint, account ID, bucket name and API token permissions.
- Use bucket-scoped Object Read & Write credentials where possible.
- Store credentials only in the Go backend's secret environment.
- Never put R2 credentials in Android, Next.js client bundles or Git.

### 7.2 Intended objects

R2 may store:
- User avatar images.
- Admin-managed announcement/banner images.
- Public app artwork/assets owned by Melo.
- APK release artifacts.
- Optional admin-uploaded documentation assets.

R2 must not store or distribute copyrighted music audio, ripped streams or user downloads from third-party music providers.

### 7.3 Object key conventions

Use generated, immutable keys; do not trust user-supplied paths.

```text
avatars/{user_uuid}/{random_object_id}.{ext}
announcements/{announcement_uuid}/{random_object_id}.{ext}
assets/{asset_category}/{yyyy}/{mm}/{random_object_id}.{ext}
releases/android/{channel}/{version_code}/{variant}/{abi-or-universal}/melo.apk
```

Do not overwrite a published release artifact in place. A new build gets a new immutable object key and checksum.

### 7.4 Upload flow

1. Authenticated admin/user requests an upload intent from Go API.
2. API validates role, asset category, file size, content type and allowed extension.
3. API creates a server-generated R2 object key.
4. API returns a short-lived presigned PUT URL and required headers.
5. Client uploads directly to R2.
6. Client calls completion endpoint.
7. Backend performs a HEAD/stat operation and verifies actual size/content type/object existence; compute or independently verify checksum where feasible.
8. Backend creates/updates asset metadata in Neon.
9. On failed/abandoned uploads, expire or clean up orphaned objects through a scheduled cleanup process.

### 7.5 Download/read flow

- Public, approved artwork can use a configured public asset domain if the bucket policy and caching are intentionally configured.
- Private objects use short-lived presigned GET URLs.
- Admin-only artifacts should not be publicly enumerable.
- Release downloads can use short-lived signed URLs generated after release eligibility checks.
- Treat presigned URLs as bearer credentials; do not log them or persist long-lived links in the database.
- Set content type, cache-control and content-disposition safely.

### 7.6 Image validation

- Allowlist image formats (for example JPEG, PNG, WebP; SVG only if securely sanitized and genuinely required).
- Validate file signature/magic bytes, not only filename or request Content-Type.
- Enforce size and pixel dimensions.
- Reject HTML, executable content and malformed images.
- Consider server-side image processing/normalization to remove metadata and reduce size.
- Do not trust remote image URLs submitted by admins without server-side validation; avoid SSRF.

---

## 8. FIREBASE CLOUD MESSAGING (FCM)

### 8.1 Purpose

Use FCM for:
- New app release announcements.
- Important maintenance/security notices.
- Admin announcements.
- Opt-in feature/news notifications.
- Targeted notification campaigns based on supported app version/channel/device filters.

Do not send excessive promotional notifications. Provide notification preferences and respect Android notification permission/state.

### 8.2 Android integration

- Integrate the Firebase Messaging SDK only into variants that support Google Play Services and the existing Firebase project configuration.
- Inspect actual `gms`, `foss`, F-Droid or other variants from the repository; do not assume names.
- Preserve FOSS/no-GMS builds. If a build variant does not support FCM, ensure it still builds and the app gracefully disables push registration rather than crashing.
- Register/update installation identifiers and token/FID data with the backend through an authenticated or appropriately device-scoped endpoint.
- Rotate/update registration data when Firebase notifies the app that it changed.
- Unlink device registration on sign-out where appropriate; do not delete unrelated account data.
- Handle notification taps with deep links into the relevant release, announcement or screen.
- Do not put secrets or sensitive personal information in notification payloads.

### 8.3 Backend notification sending

- Use Firebase Admin Go SDK if supported by the pinned Go version and deployment runtime, or use FCM HTTP v1 securely.
- Authenticate server-side only.
- The Admin panel calls the Go API; it never sends directly to FCM with a server key.
- Use FID where supported by the selected current SDK/API; verify the current FCM identifier model at implementation time. If registration tokens are required by the Android SDK version in use, handle them securely and implement invalid-token cleanup.
- Batch sends in supported batch sizes, process partial failures, and persist aggregate delivery results.
- Implement dry-run/test-to-admin-device before broad send.
- Use idempotency keys to prevent duplicate campaign sends.
- Avoid unbounded fanout or sending huge batches in a single synchronous web request; use a job/worker queue for larger campaigns.
- Rate-limit campaigns and require confirmation before sending to all users.

### 8.4 FCM failure behavior

A failure to reach FCM must not break Android startup, playback or core navigation. The app must continue to work without push notifications.

---

## 9. APP UPDATE AND RELEASE MANAGEMENT

This is a top priority admin feature.

### 9.1 Inspect existing updater first

Before implementing updater code, inspect the new Android repository for any existing update checker, release API, version comparison, download manager, notification flow or installer intent.

- If a working update system exists, extend it to use the Melo backend's release metadata.
- Do not add a second updater.
- If none exists, add a small, isolated update module/service that integrates with current app architecture and does not alter music playback.

### 9.2 Release creation fields

Admin release form must support:
- Version name.
- Version code.
- Platform (Android initially).
- Channel (`stable`, `beta`, optional `nightly` if already used).
- Build variant/flavor.
- ABI/artifact type (universal, arm64-v8a, armeabi-v7a, x86_64, etc. only as actually built).
- APK/AAB artifact file (distribution method must match actual release channel).
- Release notes/changelog.
- Optional/mandatory update flag.
- Minimum supported version code.
- Rollout percentage.
- Publish/schedule time.
- Release status.

### 9.3 APK validation

Before publishing an APK:
- Verify file type and size.
- Verify SHA-256.
- Inspect package/application ID.
- Inspect version name and version code.
- Inspect supported ABIs/flavor.
- Verify signing certificate SHA-256 matches the expected release certificate.
- Verify version code is greater than the target installed version for an in-place update.
- Reject debug-signed or unexpected package artifacts for production stable releases.
- Ensure the artifact is not corrupt and is installable.
- Record all metadata in Neon.

The app's private signing key must never be uploaded to R2, stored in Neon, exposed to admin browser JavaScript or committed to Git. Signing should occur in a secured local/CI environment. The backend can validate the signed APK certificate but must not need the signing private key.

### 9.4 Release workflow

```text
DRAFT
  ↓
UPLOAD ARTIFACTS TO R2
  ↓
VERIFY CHECKSUM / PACKAGE / VERSION / SIGNATURE
  ↓
VALIDATED
  ↓
PUBLISH OR SCHEDULE
  ↓
ROLLOUT (0–100%)
  ↓
PAUSE / COMPLETE / WITHDRAW
  ↓
ROLLBACK TO A PREVIOUS APPROVED RELEASE (metadata-level)
```

Rollback means selecting a previously validated compatible release as the current recommendation. It does not magically downgrade installed Android apps. Android normally rejects downgrades and package/signature mismatches; communicate limitations clearly.

### 9.5 Update-check behavior

The Android app sends:
- Package/application ID.
- Version code/name.
- Build variant/flavor.
- ABI/device architecture.
- Release channel.
- App installation ID.

The API returns only a release compatible with that app/variant/channel and respects rollout percentage. For phased rollouts, use a stable hash of installation ID to assign a deterministic rollout cohort.

Response should include:
- `updateAvailable`.
- release ID/version name/version code.
- mandatory flag.
- minimum supported version code.
- release notes.
- artifact download URL (short-lived if private).
- file size and SHA-256.
- URL expiry if signed.

The client verifies SHA-256 after download and before launching Android's package installer. Use the platform download/install flow and show the normal user confirmation prompt. Do not attempt silent installation or bypass Android package installation security.

### 9.6 Mandatory update policy

- Mandatory updates should be rare and reserved for security, critical compatibility or service-integrity reasons.
- Provide a clear explanation to the user.
- Do not block current playback abruptly; let the user reach a safe update prompt, subject to critical policy.
- Never mark an update mandatory if no compatible artifact exists for the user's variant/ABI.
- Support a minimum supported version policy, but design a safe failure state if the update service is unreachable.
- Cache last-known-good release metadata and do not lock the app out because of transient API outages.

### 9.7 Distribution and signing constraints

If distribution is through direct APK installation, users may need to approve installs from the chosen source and Android will enforce signature/package compatibility. If Google Play distribution is used for a variant, the admin system should link to the Play listing or use the supported Play release workflow rather than download an APK directly. Document separate release flows per distribution channel.

---

## 10. ADMIN DASHBOARD REQUIREMENTS

### 10.1 Product style

Build a polished, responsive, professional admin dashboard. This is an internal management interface, not a consumer music app.

Design principles:
- Clear visual hierarchy and compact data-dense layouts.
- Responsive sidebar navigation.
- Dark and light theme if practical.
- Consistent typography, spacing and component styles.
- Loading, empty, error and success states for every data-driven screen.
- Search, filtering, pagination, confirmation dialogs and toast feedback.
- Accessible keyboard navigation, labels, contrast and focus states.
- No fake statistics or hardcoded demo data in production.

### 10.2 Navigation

1. Overview
2. Releases
3. Notifications
4. Announcements
5. Remote Configuration
6. Assets
7. Users
8. Devices
9. Admin Team / Roles
10. Audit Logs
11. Settings

Only show navigation options the current admin is authorized to access, while still enforcing every permission on the backend.

### 10.3 Overview dashboard

Show reliable metrics backed by actual data:
- Total registered accounts (if account registration enabled).
- Active installations within a defined time window.
- Current app versions/build channels.
- Latest stable/beta release.
- Pending release drafts.
- Recent announcements.
- Recent notification campaign status.
- Backend/database/storage health indicators where safe.

Clearly label time windows and definitions. Do not call a device “active” unless the backend has a measured heartbeat/last-seen event.

### 10.4 Release management UI

- Release list with status/channel/version/date/rollout.
- Create/edit draft wizard.
- Upload APKs and view upload progress.
- Show checksum, file size, package, version, ABI and signing certificate validation results.
- Block publish if validation fails.
- Preview release notes.
- Publish now or schedule.
- Set rollout percentage.
- Pause rollout.
- Roll back selection with clear compatibility warning.
- Display artifact and download status.

### 10.5 Announcements UI

- Create/edit/archive announcements.
- Title/body/image.
- Start/end time.
- Target app channels/versions where applicable.
- Preview in mobile notification/banner layout.
- Publish/unpublish.
- Optional in-app priority banner.

### 10.6 Push notification UI

- Compose title/body/data payload.
- Select audience (all eligible, channel, version range, selected devices/test devices; user segmentation only if implemented and consented).
- Test send to current admin device.
- Preview.
- Schedule or send now.
- Require explicit confirmation for large audiences.
- View sent/success/failure counts and retry eligible failures safely.
- Do not expose raw FCM identifiers.

### 10.7 Remote configuration UI

- Manage allowlisted config keys only.
- Typed values: boolean, number, string, JSON object where explicitly defined.
- Description and default value.
- Channel/version targeting.
- Enable/disable flag.
- Version history and audit events.
- Validate schema and bounds before publish.
- Emergency rollback to last known good config.

Do not allow arbitrary remote code, arbitrary URLs, downloaded executable scripts or unsafe HTML to be pushed into the app. Remote config is not a mechanism for bypassing app-store or Android security requirements.

### 10.8 Asset manager UI

- Upload artwork, banners, avatars or other allowed assets.
- Preview image and metadata.
- Show size/type/object key/visibility/creator/date.
- Replace by creating a new object and updating references; avoid destructive overwrite.
- Delete/archive only with permission and dependency checks.
- Use signed upload URLs; never expose R2 credentials.

### 10.9 User and device management UI

- Search by username/email/Firebase UID only where authorized.
- View limited profile information and linked app installations.
- View app version/channel/last seen.
- Suspend/restore account only if account system/policy supports it.
- Remove stale device registration.
- Never show user passwords, raw auth tokens, raw FCM tokens or service credentials.
- Do not expose detailed music listening histories to administrators by default.

### 10.10 Admin roles and audit logs

- Super Admin can invite/promote/demote approved admins.
- Enforce permission checks in Go API.
- Require confirmation for high-impact role changes.
- Record actor, timestamp, action, resource and redacted before/after state.
- Audit log is searchable/filterable and append-only through normal dashboard operations.
- Do not allow self-promotion or self-granting super-admin rights through public APIs.

---

## 11. DATABASE / API FEATURE FLOWS

### 11.1 Sign-in and authenticated API request

1. User signs in through Firebase SDK.
2. Android obtains Firebase ID token.
3. Android calls Go API using `Authorization: Bearer <ID_TOKEN>` over HTTPS.
4. Go middleware verifies the ID token against the correct Firebase project.
5. Go obtains verified Firebase UID from the token.
6. Backend loads/creates allowed profile record and authorizes operation.
7. Database query is scoped to the authenticated user.
8. API returns minimum required data.

### 11.2 Device registration

1. App generates/loads a stable installation ID.
2. Supported GMS variant obtains current FCM registration identifier/FID as required by selected SDK.
3. App reports installation ID, app version, variant, ABI and push identifier to backend.
4. Backend associates with authenticated profile if signed in; otherwise store only minimal anonymous installation data if product analytics/updates require it.
5. Update `last_seen_at` on controlled heartbeat/app-open/update-check events, not every screen render.
6. Remove invalid/stale push destinations after send failures.

### 11.3 Release publishing

1. Release Manager creates draft.
2. Backend validates permission and assigns release ID/object key.
3. Backend creates short-lived upload URL for each expected artifact.
4. Admin uploads binary directly to R2.
5. Admin confirms upload.
6. Backend inspects object and metadata; a controlled validation worker can download/check APK details if needed.
7. Backend verifies SHA-256, package ID, version, ABI and signing certificate.
8. Release Manager publishes/schedules.
9. Backend transaction updates release status/current release metadata and inserts audit event.
10. Optional FCM notice is sent via campaign workflow.
11. App checks release endpoint and receives compatible metadata.
12. App downloads, verifies SHA-256, then opens Android installer flow.

### 11.4 Announcements and notifications

- Admin saves draft.
- Backend validates content/targeting and persists it.
- Admin publishes in-app announcement.
- If push is selected, backend creates a campaign and schedules/sends via worker.
- FCM result counts and errors are stored without retaining unnecessary sensitive provider data.

### 11.5 Cloud library sync

- Sync is user-authenticated and local-first.
- Use versioned payloads and stable record IDs.
- Prefer upsert/idempotency keys; use `updated_at` plus revision/version fields.
- Define conflict strategy (newest timestamp or explicit field-level merge) and test concurrent edits.
- Paginate large libraries.
- Do not block music playback on sync failures.

---

## 12. PRIVACY, SECURITY AND ABUSE PREVENTION

### 12.1 Secrets

Never expose:
- Neon connection strings/passwords.
- Cloudflare R2 access key/secret.
- Firebase Admin service-account private key.
- Firebase server credentials.
- Release keystore/private key/password.
- Admin session secrets.
- Private signing keys or webhook secrets.

Secrets must be available only to the service that needs them. Use host secret manager or environment injection; keep `.env.example` values blank/example-only.

### 12.2 Authentication and authorization

- Verify Firebase ID tokens server-side.
- Do not accept a client-supplied UID as proof of identity.
- Use server-side RBAC on every privileged endpoint.
- Enforce object ownership on all user resources.
- Apply least privilege to database/R2 credentials.
- Add admin session expiry and reauthentication for sensitive operations where practical.
- Enable MFA for admins if supported by configured Firebase providers/project policy.

### 12.3 API protection

- HTTPS only in production.
- CORS allowlist.
- Rate limiting.
- Request size and upload-size limits.
- SQL injection prevention with parameterized queries.
- XSS prevention in release notes and announcement rendering.
- CSRF protection for cookie-based admin sessions.
- SSRF protection: do not fetch arbitrary user-supplied URLs from backend.
- Avoid detailed error leakage.
- Add dependency scanning and secret scanning in CI.

### 12.4 Data minimization

- Collect only device/app metrics needed for releases and service reliability.
- Do not collect precise location.
- Do not collect contacts or unrelated identifiers.
- Do not store detailed listening history unless users are clearly informed and the feature requires it.
- Provide account data deletion/export process if user accounts are supported.
- Define retention periods for stale devices, FCM campaign logs and audit logs.

### 12.5 R2 security

- Private-by-default bucket unless approved public asset distribution requires a public custom domain.
- Server-generated object keys.
- Short-lived presigned URLs.
- Content-type/size/signature validation.
- Prevent object path traversal and unauthorized deletes.
- Audit asset mutations.

### 12.6 Android security

- Do not embed backend/database/R2/Firebase Admin secrets.
- Store auth tokens using supported secure platform storage/SDK-managed mechanisms.
- Avoid logging ID tokens, FCM identifiers or signed URLs.
- Keep cleartext HTTP disabled in production unless a documented local-development exception exists.
- Review Android backup rules for auth/session data.
- Do not weaken certificate or package installer security.

---

## 13. TESTING AND ACCEPTANCE CRITERIA

### 13.1 Source replacement acceptance

- [ ] New repository cloned from the specified GitHub URL.
- [ ] Commit SHA, branch and date recorded.
- [ ] Old workspace backed up and verified.
- [ ] Untouched new app build attempted and result documented.
- [ ] New app is the sole active Android source.
- [ ] Old Android source is no longer in the active project, but backup remains outside it.
- [ ] No cloud project, Neon database or R2 bucket was deleted/recreated.
- [ ] No secret appears in Git history, tracked files, logs or docs.

### 13.2 Android acceptance

- [ ] Existing music app builds in each supported target variant or every known blocker is documented.
- [ ] Existing music search/playback/queue/background playback/downloads/lyrics/library features relevant to source continue working.
- [ ] Guest usage is not unintentionally blocked.
- [ ] Firebase sign-in/out works where configured.
- [ ] Expired ID token refresh works.
- [ ] Device registration works in supported GMS variants.
- [ ] FOSS/no-GMS variants compile and gracefully operate without FCM if present.
- [ ] App can start and play music while backend is offline.
- [ ] Remote config failure uses safe cached/default values.
- [ ] Update check failure does not lock out app usage.
- [ ] Downloaded APK checksum is verified before install prompt.
- [ ] Update package/signature compatibility is verified.

### 13.3 Backend acceptance

- [ ] API starts with valid environment.
- [ ] API refuses unsafe/invalid configuration.
- [ ] Health endpoints behave as expected.
- [ ] Valid Firebase ID token succeeds.
- [ ] Invalid/expired/wrong-project token is rejected.
- [ ] Admin endpoints reject non-admin users.
- [ ] User cannot read/update another user's data.
- [ ] Neon migrations apply safely and can be tested against a non-production branch first.
- [ ] R2 upload intent works without exposing keys.
- [ ] Upload completion verifies object metadata.
- [ ] Release validation verifies artifact checksum/package/version/signature.
- [ ] FCM dry-run/test send succeeds on a supported device.
- [ ] Partial FCM failures are handled and recorded.
- [ ] Audit log is generated for admin mutations.

### 13.4 Admin acceptance

- [ ] Admin login works with existing Firebase project.
- [ ] Unauthorized user cannot enter admin features by changing the UI.
- [ ] Backend RBAC blocks forbidden actions.
- [ ] Overview metrics use real data.
- [ ] Create/upload/validate/publish release workflow works end-to-end.
- [ ] Stable/beta filters and rollout work.
- [ ] Pause/rollback is permission-protected and audited.
- [ ] Announcement publication appears in Android app.
- [ ] FCM test campaign is delivered to intended test device.
- [ ] Remote config update reaches app and respects fallback behavior.
- [ ] Asset upload/preview/delete/archive works with R2 permissions.
- [ ] Audit logs show accurate actor/action/resource.
- [ ] Empty/loading/error states exist.
- [ ] Admin UI is responsive and keyboard accessible.

### 13.5 Security acceptance

- [ ] No secret values in repository or build artifacts.
- [ ] `.gitignore` covers environment files, keystores, service account JSON and local SDK files.
- [ ] R2 bucket is not unintentionally public.
- [ ] Neon credentials are server-side only.
- [ ] Firebase Admin credentials are server-side only.
- [ ] Admin role is not derived from client-controlled claims without backend authorization.
- [ ] Presigned URLs expire and are not logged.
- [ ] Upload types/sizes are restricted.
- [ ] Sensitive operations are audited.

---

## 14. IMPLEMENTATION PHASES AND EXECUTION ORDER

Do not jump ahead. Complete each phase and produce a report before moving on.

### Phase 0 — Workspace, credential and resource inventory

Tasks:
- Inspect current workspace and Git state.
- Locate old Android app, credentials/config files, migrations, backend work and signing materials.
- Create a redacted secret inventory.
- Back up old workspace outside active project.
- Verify backup.
- Record Firebase project ID, Neon project/database identity and R2 bucket identity without revealing secrets.

Deliverables:
- `docs/phase-0-inventory.md`
- `docs/credentials-inventory.redacted.md`
- Verified backup location (do not include secret values in report).

Exit gate: backup verified; no destructive replacement yet.

### Phase 1 — Clone and audit colleague-modified Melo

Tasks:
- Clone `https://github.com/techxsarwar/melo.git`.
- Record branch/commit/structure.
- Inspect every module, build file and source set.
- Identify package/signing/build variants.
- Identify existing updater and integration points.
- Build untouched clone and run tests.

Deliverables:
- `docs/repository-audit.md`
- `docs/android-feature-inventory.md`
- Build/test report.

Exit gate: correct new app confirmed and baseline build outcome recorded.

### Phase 2 — Replace active Android source

Tasks:
- Make the new repository the active Android source.
- Preserve new repository Git history and license.
- Move old source out of active workspace; keep verified backup outside.
- Re-establish clean Git/remotes without pushing or deleting remotes without authorization.
- Verify Gradle builds after move.

Deliverables:
- New workspace layout.
- `docs/source-replacement-report.md`.

Exit gate: new Android code is active; backup remains; no cloud resource was changed.

### Phase 3 — Backend foundation and Neon

Tasks:
- Initialize Go service and configuration validation.
- Connect to existing Neon project.
- Inspect existing schema; create only missing tables through migrations.
- Add repository/query layer, health checks, structured logs, auth middleware skeleton and OpenAPI.
- Add local/test environment setup.

Deliverables:
- Running Go API.
- SQL migrations.
- Database architecture documentation.
- API specification.

Exit gate: backend connects to Neon safely; migration tests pass on non-production/test branch.

### Phase 4 — Firebase Authentication and authorization

Tasks:
- Configure new Android application registration in the existing Firebase project if package ID/variant requires it.
- Integrate Firebase client authentication into supported Android variants.
- Integrate Firebase Web Auth into Next.js admin.
- Integrate Firebase Admin SDK or supported token verification in Go.
- Bootstrap first super-admin through a safe one-time CLI/SQL process.
- Add roles and middleware.

Deliverables:
- Working user/admin authentication flows.
- Role/permission checks.
- Documentation for Firebase configuration.

Exit gate: invalid tokens and non-admin access are denied.

### Phase 5 — Cloudflare R2 and asset management

Tasks:
- Configure existing R2 bucket in backend.
- Implement presigned upload/read URL service.
- Add asset metadata in Neon.
- Implement upload verification, object key generation, deletion/archive and cleanup.
- Add admin asset manager.

Deliverables:
- R2 upload/download flows.
- Asset Manager UI.
- R2 security documentation.

Exit gate: end-to-end asset workflow succeeds without client-side R2 credentials.

### Phase 6 — App devices, user data and sync

Tasks:
- Add device registration.
- Add FCM token/FID lifecycle for supported variants.
- Add user profile/preferences.
- Implement account-linked cloud library sync only for compatible existing local models.
- Add guest-to-account merge if needed.
- Add account deletion/data deletion flow.

Deliverables:
- Device registry.
- User profile and sync endpoints.
- Android integration.

Exit gate: local playback remains functional with API unavailable; sync tests pass.

### Phase 7 — Release management and updater integration

Tasks:
- Inspect and extend existing updater or implement a small one if absent.
- Implement release and artifact database tables.
- Implement R2 artifact upload.
- Implement APK validation/signing checks.
- Implement release publishing, phased rollout and rollback metadata.
- Implement Android release-check/download/checksum/install prompt.

Deliverables:
- Admin Releases module.
- End-to-end update workflow.
- Release runbook.

Exit gate: test update between two signed compatible builds on a physical/emulated Android device.

### Phase 8 — Announcements, FCM and remote configuration

Tasks:
- Implement announcement CRUD/publishing.
- Implement FCM campaign/test send/targeting/partial failure handling.
- Implement remote configuration schema, cache and fallback.
- Integrate notification deep links and in-app notices.

Deliverables:
- Notifications and Announcements modules.
- Remote Config module.
- Android integration.

Exit gate: test message and config reaches supported app build; no-GMS variant still works.

### Phase 9 — Admin hardening, observability and release QA

Tasks:
- Complete roles, audit logs, metrics and security controls.
- Add monitoring/health checks and deployment docs.
- Run acceptance matrix.
- Fix regressions.
- Prepare release checklist and rollback plan.

Deliverables:
- Production-ready admin dashboard.
- Test report.
- Deployment/runbook docs.
- Final architecture diagram.

Exit gate: all P0 acceptance criteria pass or every remaining issue is explicitly documented and approved.

---

## 15. DEPLOYMENT AND ENVIRONMENT MANAGEMENT

### 15.1 Environments

Use separate configurations for:
- Local development.
- Staging/testing.
- Production.

Use a Neon development branch or approved test database for staging migrations. Reuse the production Neon project only for production after review. Do not point local tests at production by default.

R2 should use separate prefixes or a separate approved development bucket if available; never let staging cleanup delete production objects.

Firebase can use an approved Firebase project/app configuration per environment. If the owner requires one existing project, clearly separate Android app registrations and document the operational limitation.

### 15.2 Backend deployment

- Containerize Go API.
- Provide health/readiness probes.
- Inject secrets via hosting platform secret manager.
- Run DB migrations as a controlled release step, not every replica's startup.
- Configure connection pooling/timeouts.
- Configure CORS only for admin origins.
- Add TLS/HTTPS and domain routing.
- Add graceful shutdown.

### 15.3 Admin deployment

- Deploy Next.js with server-side environment values protected.
- Public Firebase web config may be exposed as intended client config; service account and backend secrets must not.
- Set exact allowed admin domain/origin.
- Ensure admin server actions/API calls require authentication and backend role checks.
- Use secure cookies and session expiry if using cookie sessions.

### 15.4 CI/CD

At minimum:
- Android: Gradle sync/build, unit tests, lint, dependency checks, artifact metadata and checksum generation.
- Go: `gofmt`, `go vet`, tests, race tests where useful, build, dependency/security checks.
- Admin: TypeScript typecheck, lint, tests, production build.
- SQL: migration validation against disposable/test Neon branch or local PostgreSQL.
- Secret scan before merge.

Do not publish production APK or release without an authorized approval step.

---

## 16. REQUIRED DOCUMENTATION

The agent must maintain:

- `README.md` — project overview and local setup.
- `docs/repository-audit.md` — new Android repo structure and feature inventory.
- `docs/source-replacement-report.md` — exact replacement procedure and old source backup location (no secrets).
- `docs/architecture.md` — components and trust boundaries.
- `docs/credentials-inventory.redacted.md` — names/status only; never values.
- `docs/database.md` — schema and migration procedure.
- `docs/api.md` and `backend/openapi/openapi.yaml` — endpoint contracts.
- `docs/firebase.md` — Android app registrations, auth and FCM configuration.
- `docs/cloudflare-r2.md` — bucket, prefixes, upload and access policy (no secrets).
- `docs/release-process.md` — APK build, signing, upload, validation and publish.
- `docs/deployment.md` — environments and deployment procedure.
- `docs/operations-runbook.md` — backups, incident response, rollback and credential rotation.
- `docs/known-issues.md` — outstanding limitations.

Every phase report must list files created/modified, commands/tests run, pass/fail results, remaining issues and next phase.

---

## 17. CODING AGENT WORKING RULES

1. Read this entire PRD before modifying any files.
2. Start at Phase 0 and follow the phase order.
3. Do not ask the user to repeat credentials already present in the secure workspace. Search the workspace and secret manager first.
4. Do not claim credentials are present until verified by variable name and successful connection test; never show the value.
5. If a required secret is missing, ask for that specific secret/config item by name only.
6. Never delete cloud resources or database contents.
7. Never delete the old Android source until its backup is verified and the new untouched clone builds or the build blocker is understood and documented.
8. Do not compare the new app against an assumed integration that is not there. The old workspace is used to locate reusable credentials/configuration and any backend/migration work; the new repository is inspected as the Android source to integrate.
9. Preserve the colleague's modified Android functionality and UI.
10. Make small, reviewable commits/checkpoints; never combine large destructive refactors with cloud migrations.
11. Add tests with every backend feature.
12. Avoid hardcoded versions where the repository's version catalog or dependency management should be used. Pin stable versions and document upgrades.
13. Use current official documentation for Firebase, Neon, Cloudflare R2, Android and deployment SDKs. Verify API compatibility at implementation time.
14. Do not add unnecessary dependencies or duplicate functionality.
15. Keep the app usable offline and when the new backend is unavailable.
16. Never store music stream URLs or music files in Neon/R2 as a shortcut.
17. Never use fake dashboard data in production.
18. Do not push to public GitHub, publish an APK, deploy production services or send mass notifications without explicit approval.
19. Stop and report before any irreversible operation, including production database destructive migration, deleting an R2 object collection, rotating credentials or changing application signing identity.
20. Report honestly. A build that passes is not proof of runtime behavior; a successful HTTP call is not proof of end-to-end functionality.

---

## 18. FINAL DEFINITION OF DONE

Melo is ready for its first infrastructure-enabled release when:

- The colleague-modified Melo repository is the active Android app.
- Old Android source has been removed from the active workspace after verified backup.
- Existing Firebase project, Neon database and Cloudflare R2 bucket are reused.
- No cloud resource or user data was accidentally deleted.
- Go backend is deployed and connected to Neon and R2.
- Firebase Authentication is integrated for the intended user/admin flows.
- FCM works on supported app variants and degrades gracefully elsewhere.
- Admin dashboard is deployed and backend-authorized.
- Admin can create, upload, validate, publish and roll out a release.
- Android can discover a compatible release, download it, verify checksum and invoke the supported install flow.
- Admin can publish an announcement and send a test push notification.
- Remote config updates safely with a cached/default fallback.
- R2 asset uploads work through short-lived presigned URLs.
- Existing music functionality has no critical regression.
- Security checks, build checks, tests and documentation are complete.

---

## 19. OFFICIAL TECHNICAL REFERENCES

Use these references to verify current SDK and service behavior while implementing. Do not rely on obsolete snippets or unofficial tutorials when official documentation exists.

### Firebase
- Firebase Authentication: https://firebase.google.com/docs/auth
- Verify Firebase ID tokens: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Firebase Admin SDK setup: https://firebase.google.com/docs/admin/setup
- Firebase Cloud Messaging overview: https://firebase.google.com/docs/cloud-messaging
- Send FCM messages with Admin SDK: https://firebase.google.com/docs/cloud-messaging/send/admin-sdk

### Cloudflare R2
- R2 S3-compatible API: https://developers.cloudflare.com/r2/get-started/s3/
- R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- R2 upload objects: https://developers.cloudflare.com/r2/objects/upload-objects/

### Neon / PostgreSQL
- Neon documentation: https://neon.com/docs
- Neon connection guide: https://neon.com/docs/connect/connect-from-any-app
- PostgreSQL documentation: https://www.postgresql.org/docs/

### Android
- Android build structure: https://developer.android.com/build
- Android app signing: https://developer.android.com/studio/publish/app-signing
- Package installer / app updates: https://developer.android.com/reference/android/content/pm/PackageInstaller

---

# START COMMAND FOR THE AGENT

Read this PRD fully. Then execute **Phase 0 only**:

1. Audit the current old Melo workspace.
2. Locate the existing Firebase, Neon and Cloudflare configuration without printing any secret values.
3. Locate the existing backend/SQL work and release signing material.
4. Create and verify a timestamped backup outside the active project.
5. Produce the redacted credential/resource inventory.
6. Do not delete, replace or modify production cloud resources.
7. Do not remove the old Android source yet.

After Phase 0, continue with Phase 1: clone `https://github.com/techxsarwar/melo.git`, inspect the complete source and establish a clean baseline build. Only proceed to source replacement after the backup and new-source verification gates are satisfied.

**The objective is simple: replace the old Android code with the colleague-modified Melo app, preserve and reuse the existing cloud resources and credentials, then build the backend integrations and Melo Admin panel around the new app.**
