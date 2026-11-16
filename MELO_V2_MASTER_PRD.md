# MELO V2 — Master Product Requirements Document & Coding-Agent Execution Brief

**Document type:** Product + technical implementation specification  
**Product:** Melo V2 (Android music application + backend + admin dashboard)  
**Status:** Implementation brief for the coding agent  
**Source foundation:** https://github.com/techxsarwar/melo  
**Primary client:** Android  
**Primary backend stack:** Go REST API + Neon PostgreSQL + Firebase Authentication + Firebase Cloud Messaging + Cloudflare R2  
**Admin dashboard:** Next.js + TypeScript  
**Last updated:** 15 November 2026

---

## 0. Instructions to the coding agent — read this first

You are the lead Android engineer, backend engineer, database architect, security engineer, UI/UX engineer, and QA engineer responsible for delivering **Melo V2**.

Your task is to evolve the existing Melo Android application into a production-quality V2. The current application is already popular among a real user community. Treat the existing codebase and working app as a valuable product, not as a disposable prototype.

### Non-negotiable rules

1. **Clone and audit the original source before changing code.** The upstream repository is `https://github.com/techxsarwar/melo.git`.
2. **Build and run the original project first.** Establish a verified baseline before making changes.
3. **Read the entire repository.** Inspect every module, source file, Gradle file, manifest, resource, asset, test, workflow, release configuration, and license file. Do not make architecture decisions from the README alone.
4. **Preserve the original music-player experience.** Do not casually replace the playback engine, navigation, design system, or provider integrations. Retain working features unless the audit proves they are broken, unsafe, incompatible, or legally unsuitable.
5. **Verify existing features in code and at runtime.** A string resource, TODO, screen stub, README claim, or unused class is not proof that a feature works. Create an inventory marked `working`, `partial`, `stub`, `broken`, `unverified`, or `not present`.
6. **Do not perform a blind rewrite.** Prefer incremental changes, adapters, and modular additions. Refactor only when justified by evidence.
7. **Do not put database, R2, or Firebase Admin secrets in Android or browser code.** All privileged operations go through the backend.
8. **Do not silently install APK updates.** Android must use the normal package installer / user-approved update flow. Verify APK integrity and signing identity before handing it to the installer.
9. **Do not bypass DRM, paywalls, region restrictions, access controls, or third-party rate limits.** Do not intercept or remove third-party advertisements, scrape restricted content, or build a music-stream proxy. Audit each music provider's terms and rights. Disable integrations that cannot be used lawfully and reliably.
10. **Respect the upstream GPL-3.0 license.** Preserve notices, attribution, source-availability and distribution obligations. Audit licenses of dependencies and assets. Do not remove upstream credits.
11. **Do not invent secrets, Firebase configuration, R2 credentials, Neon connection strings, signing keys, API endpoints, or production IDs.** Add documented placeholders and ask the project owner to supply real configuration when required.
12. **Never commit `.env`, service-account JSON, keystores, signing passwords, API tokens, or private keys.** Add and verify `.gitignore` rules and secret scanning.
13. **Do not stop after producing an audit report.** After the audit and baseline are documented, create an implementation plan and execute it phase by phase. Continue autonomously as far as the environment allows. If an external credential or account action is missing, implement the integration with safe placeholders, write exact setup instructions, and continue other work.
14. **Do not report tests as passing unless you actually ran them.** Record commands, results, and known failures.
15. Maintain `IMPLEMENTATION_PLAN.md`, `AUDIT_REPORT.md`, `DECISIONS.md`, `SECURITY_REVIEW.md`, and `CHANGELOG.md` as work progresses.

### Required first response from the agent

Before editing source code, report:

- repository commit hash and branch inspected;
- full module/repository tree;
- available build tools and versions;
- baseline build/test result;
- current application ID, version code/name, min/target SDK, signing configuration, and release channels;
- architecture and data-flow diagrams;
- complete current feature inventory with implementation evidence;
- known security, privacy, licensing, compatibility, and technical risks;
- a staged implementation plan with files/modules likely to change.

Then proceed to implementation. Do not wait for approval for ordinary engineering decisions. Record assumptions and keep them reversible.

---

# 1. Product vision

Melo V2 is the next generation of the existing Melo Android music app. It must preserve the familiar fast, polished, offline-friendly music experience while adding user identity, cloud library synchronization, community features, remote announcements, controlled app releases, and a secure administration platform.

**Product promise:** “Your music. Your community. Your experience.”

The V2 must feel like a natural evolution of Melo—not a completely different app. Existing users should recognize the player, understand the new account features quickly, and continue listening without being forced to register.

## 1.1 Product goals

1. Preserve and improve the current music discovery, search, queue, and playback experience.
2. Add optional Melo accounts powered by Firebase Authentication.
3. Allow users to synchronize supported personal data across devices using the backend and Neon PostgreSQL.
4. Store user-uploaded images and admin-managed visual assets in Cloudflare R2.
5. Send relevant announcements and release notifications using Firebase Cloud Messaging (FCM).
6. Provide a secure web admin dashboard for user support, content curation, announcements, remote configuration, analytics, and release management.
7. Add community functionality in a controlled, privacy-conscious way.
8. Make upgrades safe for existing installations and preserve local user data.
9. Keep the Android client offline-first for local music-library and player operations.
10. Build a maintainable codebase with tests, documentation, observability, and safe deployment practices.

## 1.2 Non-goals

Unless the repository audit establishes that a capability already exists and is safe to retain, the initial V2 is **not** intended to:

- host, distribute, or proxy copyrighted music files;
- build a new music streaming service or audio CDN;
- bypass DRM, paid subscriptions, geographic controls, authentication, or provider restrictions;
- provide direct messaging, public chat rooms, or an unmoderated social network;
- force every listener to create an account;
- silently install APKs or bypass Android's package installer;
- replace every existing screen just for visual novelty;
- introduce AI features merely for marketing;
- collect precise location, contacts, microphone data, or unnecessary personal information.

---

# 2. Fixed technology decisions

Use these technologies unless the source audit reveals a concrete incompatibility. Any proposed substitution must be documented in `DECISIONS.md` with reasons and trade-offs.

| Area | Required technology | Responsibility |
|---|---|---|
| Android application | Existing Kotlin project | Preserve existing client |
| Android UI | Existing Jetpack Compose / Material 3 system | Retain design language and extend it |
| Audio playback | Existing Media3 / ExoPlayer implementation | Preserve and harden playback |
| Local persistence | Existing Room database and DataStore/preferences where appropriate | Offline-first local state |
| Authentication | Firebase Authentication | Email/password and Google sign-in; optional guest/local mode |
| Backend API | Go REST API | All privileged business logic and data access |
| Main database | Neon PostgreSQL | Accounts profile metadata, cloud library, playlists, community, configuration, releases, admin records |
| Image/object storage | Cloudflare R2, S3-compatible API | Avatars, playlist artwork, announcement artwork, admin images |
| Push notifications | Firebase Cloud Messaging | Device-targeted announcements and event notifications |
| Admin dashboard | Next.js + TypeScript | Secure web management interface |
| Admin UI | Tailwind CSS + shadcn/ui or existing consistent component system | Accessible dashboard |
| Go database driver | `pgx` / `pgxpool` | PostgreSQL access |
| Database migrations | Goose or a comparable versioned migration tool | Reproducible schema changes |
| Query layer | `sqlc` preferred, or carefully structured repository layer | Typed database access |
| API contract | OpenAPI 3.1 | Documented API and generated types where practical |
| R2 client | AWS SDK for Go v2 S3 client | Server-side R2 and presigned URL generation |
| Backend auth/FCM | Firebase Admin Go SDK | Verify ID tokens and send FCM messages |

### 2.1 Why the backend is mandatory

Android and the admin browser must never connect directly to Neon with a database connection string. Neither client may contain R2 secret access keys or Firebase service-account credentials. The Go API is the trusted boundary:

- verifies Firebase ID tokens;
- checks user status and authorization;
- performs database reads/writes;
- creates short-lived R2 presigned URLs;
- sends FCM notifications;
- enforces admin permissions;
- applies rate limits and validation;
- writes audit logs.

Firebase's Android SDK authenticates the user and issues an ID token. The app sends that token to the Go API over HTTPS. The API verifies the token using Firebase Admin SDK and derives the user identity from the verified Firebase UID. Never trust a UID sent in the request body as proof of identity.

### 2.2 Backend implementation default

Build a standalone Go service. Use a conventional project structure, for example:

```text
backend/
  cmd/api/main.go
  cmd/migrate/main.go
  internal/
    auth/
    config/
    database/
    http/handlers/
    http/middleware/
    users/
    library/
    playlists/
    community/
    announcements/
    releases/
    uploads/
    notifications/
    admin/
    audit/
    jobs/
  migrations/
  openapi/
  tests/
  go.mod
```

Use a maintained Go release compatible with the current Firebase Admin Go SDK. Pin dependencies and commit `go.mod` / `go.sum`. The API should use a maintained router or `net/http` with clear routing and middleware. Avoid unnecessary microservices: one modular monolith is the correct initial architecture.

### 2.3 Environment separation

Create separate development, staging, and production configuration for:

- Firebase project/app;
- Neon database / branch;
- R2 bucket(s) and public image domain;
- backend API URL;
- admin dashboard URL;
- FCM credentials;
- app release channels.

Do not let test data or development tokens reach production. Prefer a Neon development branch and a separate Firebase project for development/testing.

---

# 3. Repository acquisition and mandatory audit

## 3.1 Clone instructions

From the project workspace, clone the upstream source into a clearly named directory. Do not clone over an existing folder without checking it first.

```powershell
# Run from the chosen workspace parent directory
 git clone https://github.com/techxsarwar/melo.git melo-v2
 cd melo-v2
 git remote -v
 git status --short
 git rev-parse HEAD
 git branch --show-current
```

Keep the upstream remote named `origin` initially, or rename/add remotes clearly if creating a separate owned fork. Create a working branch such as `melo-v2-development`. Do not delete or rewrite upstream history. Record the exact upstream commit SHA in `AUDIT_REPORT.md`.

If the folder already exists, inspect it first; do not overwrite user work. If there is an existing local working copy, compare it to upstream and preserve all uncommitted work.

## 3.2 Inspect every repository layer

Inspect all files and directories, not just the top-level README:

- `app/` — all Kotlin source, Compose screens, ViewModels, repositories, services, workers, receivers, database entities/DAOs/migrations, resources, navigation, manifest, build configuration, tests, assets, and signing/update code.
- `innertube/` — provider client, request/response models, auth/session handling, search, metadata, stream handling, throttling, retries, and error behavior.
- `lrclib/` and `betterlyrics/` — lyrics providers and sync behavior.
- `lastfm/` — metadata/discovery integration and credentials, if any.
- `kugou/` and `simpmusic/` — all external provider integrations and licensing/terms implications.
- `kizzy/` — Discord integration, permissions, data disclosure, and optionality.
- `canvas/` — artwork/visualization implementation and image handling.
- all Gradle settings, version catalogs, build scripts, wrapper, convention plugins, ProGuard/R8 rules, lint rules, workflows, Fastlane metadata, update feed, and release scripts;
- `LICENSE`, third-party notices, dependency licenses, assets, fonts, icons, and upstream attributions;
- CI/CD and tests, including disabled or skipped tests.

Use targeted source searches for:

```text
TODO, FIXME, XXX, NotImplemented, runBlocking, GlobalScope,
Thread.sleep, cleartext, http://, WebView, api_key, secret,
keystore, signingConfig, update, release, download, backup,
RoomDatabase, Migration, WorkManager, MediaSession, ExoPlayer,
Firebase, Supabase, PostgREST, InnerTube, stream, lyrics,
notification, FCM, analytics, crash, permission
```

Search for all network endpoints and external domains. Identify what each provider call does and whether it is actually used by a visible feature.

## 3.3 Baseline validation

Before editing:

1. Read README and project setup requirements.
2. Record installed JDK, Gradle wrapper, Android SDK, Kotlin, AGP, and Go/Node versions.
3. Sync Gradle dependencies.
4. Build the original debug variant.
5. Run existing unit tests, lint, and available instrumentation tests.
6. Launch on an emulator or physical device if available.
7. Exercise search, playback, background playback, queue, lyrics, library, settings, and offline behavior.
8. Capture baseline screenshots and record defects.
9. Record the exact commands and logs. Do not silently “fix” baseline defects before documenting them.

Suggested commands (adjust to the actual Gradle tasks):

```powershell
.\gradlew.bat tasks
.\gradlew.bat assembleDebug
.\gradlew.bat test
.\gradlew.bat lint
```

## 3.4 Required audit report

Create `AUDIT_REPORT.md` with:

- repository tree and module responsibilities;
- app package/application ID and versioning/signing details;
- architecture and data-flow diagrams;
- screen inventory and navigation map;
- feature matrix with evidence and runtime verification;
- Room schema and migration history;
- all external API/provider integrations, endpoints, credentials, terms/risks, and failure behavior;
- current app-update mechanism and its limitations;
- current backup/offline caching behavior;
- network/security/privacy findings;
- dependency and license inventory;
- baseline build/test results;
- risks and recommendations;
- exact files/modules to change for each V2 feature.

Do not claim an existing feature is complete until you have traced its code path and tested it when possible.

---

# 4. Preserve the original Melo experience

The public repository describes Melo as an independent YouTube Music-style client and documents an ad-free/no-subscription user experience, offline-oriented behavior, Material You design, background playback, encrypted offline caching, gapless playback, crossfade, silence skipping, loudness normalization, tempo/pitch controls, synced lyrics/translation, personalized home feed, and year-in-review statistics. It lists Kotlin, Compose, Material 3, Media3/ExoPlayer, Hilt, Room, Ktor, Retrofit, Coroutines/Flow, and Gradle Kotlin DSL.

These README items are the **starting inventory only**. The coding agent must establish their actual implementation status in the current commit.

## 4.1 Preservation requirements

- Keep the current app ID unless a documented technical/legal reason forces a migration. Existing update continuity depends on package ID and signing identity.
- Preserve the existing release signing key and signing configuration. Never generate a replacement key for an established package without understanding the impact.
- Keep the existing playback service, MediaSession, audio focus handling, notification controls, queue engine, and Media3 integration unless the audit shows a specific defect.
- Keep existing module boundaries and public APIs where practical.
- Preserve Room data during database schema upgrades.
- Preserve settings, playlists, liked songs, downloads/cache metadata, listening history, and playback preferences wherever the current design stores them.
- Keep the existing theme, typography, spacing, animations, icon language, and navigation familiar. Extend the visual system rather than replacing it with generic template UI.
- Make all new account/community features optional where practical.
- New backend failure must not prevent local playback or access to already available local library data.

## 4.2 Existing feature verification list

Audit and classify each item:

- Home/personalized feed;
- music search and discovery;
- song, album, artist, and playlist details;
- queue and playback controls;
- background playback and notification controls;
- media session and Bluetooth/headset controls;
- shuffle, repeat, queue editing;
- liked songs and user library;
- playlists and playlist import/export;
- lyrics, synced lyrics, translation, and provider fallback;
- offline caching/downloads and encryption;
- audio normalization, equalizer/system EQ, crossfade, silence skipping, tempo/pitch;
- listening statistics/year in review;
- themes/dynamic colors and accessibility;
- Discord Rich Presence;
- external provider login or session handling;
- backup/restore;
- synchronized listening / Melo Together if present;
- app update notifications/changelog/channels;
- community/featured playlists if present.

Feature strings, resource IDs, or unused classes must be marked as stubs until proven otherwise.

## 4.3 Music-source compliance boundary

The original source integrates with third-party music metadata/streaming providers. Before retaining each integration, document:

- provider name and documented/undocumented status;
- its published API terms and acceptable usage;
- authentication model and account/session data used;
- whether audio is streamed directly from the provider or passed through the Melo backend;
- any caching/offline behavior and whether explicitly permitted;
- rate limits, retry/backoff requirements, and failure handling;
- whether the integration can be maintained without bypassing access restrictions.

Do not move third-party audio through the Melo backend or store extracted/expiring stream URLs in Neon. Do not store copyrighted audio in R2. Do not add ad interception, DRM circumvention, premium-access bypass, geo-restriction bypass, or unauthorized downloads. Keep music provider adapters isolated so a provider can be disabled or replaced without affecting the UI/player architecture. If an integration cannot be used within its terms, document the issue and disable or replace it with a lawful source.

---

# 5. User roles and account model

## 5.1 User types

1. **Guest/local listener:** can use the core player without registering. Data stays on-device. The user can later sign in and migrate supported local data to the cloud.
2. **Registered listener:** authenticated through Firebase Auth; can synchronize personal library and use account features.
3. **Community member:** registered listener who opts into a public or limited profile and community features.
4. **Moderator:** can handle reports and moderate community content through the admin dashboard.
5. **Content manager:** can manage announcements, curated playlists, and release notes but cannot change system/security settings or promote admins.
6. **Super administrator:** full administrative access, explicitly provisioned outside the public client flow.

## 5.2 Authentication methods

Initial supported sign-in methods:

- Google sign-in through Firebase Authentication;
- email/password through Firebase Authentication;
- email verification and password reset;
- optional local/guest mode without account creation.

Do not add phone-number authentication by default. It introduces SMS cost, friction, and extra personal data. Add it only if there is a documented product need and the owner configures it in Firebase.

If Firebase anonymous authentication is used for an optional guest-cloud experience, it must be linkable to a permanent provider account without losing the Firebase UID or cloud data. Otherwise, use local-only guest mode for V2 launch.

## 5.3 Account lifecycle

Implement:

- create account;
- sign in / sign out;
- email verification status;
- forgot/reset password;
- Google account linking where supported;
- session refresh through Firebase SDK;
- user suspension/ban handling;
- logout on a device;
- account deletion request and backend cleanup/anonymization;
- account export/download of user-owned data where feasible;
- guest-to-account migration;
- conflict handling if local data already exists in the target account.

The app must not require an account to play music. Account prompts should be contextual and low pressure (e.g. “Sign in to sync your library”).

## 5.4 Profile data and privacy defaults

Profile fields:

- unique username (optional for basic account, required before community publishing);
- display name;
- avatar image;
- short optional bio;
- profile visibility: private / public;
- optional public playlist links.

Do not collect date of birth, school name, precise location, contacts, phone number, or real-world identity unless the owner later defines a legitimate requirement and appropriate safeguards. Do not expose email addresses publicly. Public profile is opt-in. Listening history is private by default. No direct messages in initial V2.

Because the app is used in a school/local community, use privacy-by-default design and avoid features that expose a listener's identity, location, or listening behavior without explicit consent. Include report/block controls for public content and a clear community code of conduct.

---

# 6. Android application requirements

## 6.1 Navigation and information architecture

Retain current navigation if it works and users recognize it. Add new destinations in the existing navigation style. A recommended target organization, subject to the audit:

- **Home:** existing personalized feed, featured collections, recent content, announcements banner;
- **Search:** existing music search and discovery;
- **Library:** liked songs, playlists, albums/artists, downloads/cache, history;
- **Community:** curated/community playlists, public profiles, following, rooms if existing implementation supports them;
- **Profile/Settings:** account, sync state, privacy, notifications, app settings, about, feedback.

Do not add a bottom-navigation item for every feature. Use nested screens or settings sections where appropriate.

## 6.2 Onboarding and account UX

First-run/update behavior:

- Existing users upgrading must not be forced into a new sign-in screen before playback.
- Existing local data must be preserved.
- Explain the benefit of signing in: library backup and cross-device sync.
- Provide clear “Continue as guest” and “Sign in” choices.
- If a guest later signs in, show a migration/merge preview and avoid destructive replacement.
- Make auth errors actionable and readable.
- Avoid repeatedly showing sign-in nags after dismissal.

Required screens/states:

- welcome/account-choice screen;
- Google sign-in flow;
- email sign-in/create-account flow;
- email verification state;
- reset password state;
- profile setup/edit;
- account and connected device settings;
- sign-out confirmation if local data could be affected;
- delete-account request and confirmation;
- sync state and last successful sync;
- merge/conflict resolution where a choice is needed.

## 6.3 Cloud library sync

Synchronize user-owned metadata, not music files or temporary source URLs.

Initial cloud-synced data:

- liked/saved tracks;
- user-created playlists and playlist order;
- saved albums and artists if the existing model supports them;
- selected player/app preferences;
- optional listening history after explicit opt-in;
- user profile and avatar reference.

Not synchronized by default:

- active audio stream URLs;
- authentication cookies/session tokens for third-party providers;
- raw audio/download files;
- temporary queues unless user explicitly opts into queue sync;
- sensitive device identifiers beyond a random app-generated device ID;
- private data from other apps.

### Sync behavior

- Local Room remains the immediate source for UI responsiveness and offline use.
- Sync runs after sign-in, on app resume when appropriate, after local edits, and via bounded background work.
- Debounce rapid edits; batch network operations.
- Use idempotent mutations and server-issued cursors/revisions.
- Handle offline changes and later reconciliation.
- Provide retry/backoff for transient failures.
- Never block playback or navigation while syncing.
- Show `Synced`, `Syncing`, `Offline changes pending`, or `Sync needs attention` states without noisy alerts.
- Resolve conflicts deterministically. Use server revision + client mutation IDs; avoid relying solely on device wall-clock timestamps.
- For playlist tracks, preserve ordering with a stable position/rank representation and server-side conflict policy.
- Support user-initiated “Sync now”.
- If the user signs out, retain local data unless they explicitly choose to remove it from the device.

### Guest-to-account migration

1. Read local supported library records.
2. Authenticate with Firebase.
3. Fetch server library snapshot/revision.
4. Build a merge preview (counts of local-only/cloud-only/conflicting records).
5. Merge using stable provider IDs and idempotent upserts.
6. Preserve playlist track order and duplicate semantics.
7. Persist sync cursor after transaction success.
8. Mark migration complete only when all batches are acknowledged.
9. Make the process restartable after network failure.
10. Never delete local records as a side effect of a failed sync.

## 6.4 Profile and social UI

- Profile is private by default.
- User must opt into public visibility before appearing in discovery.
- Username uniqueness enforced server-side, case-insensitive.
- Show only selected public information.
- Let the user hide playlists individually.
- Provide report and block actions on public profiles/content.
- Do not add direct messages or free-form public chat in this release.

## 6.5 Community playlist experience

- Create playlist;
- choose title/description/cover;
- public, unlisted/share-link, or private visibility;
- share deep link;
- follow/save public playlist;
- report playlist;
- optionally enable collaboration with explicit member roles;
- owner can revoke access or delete playlist;
- collaborators cannot exceed permission granted by the owner;
- server validates all writes and ownership.

The original local playlist workflow must remain usable without a network connection. Public publishing requires connectivity and authentication.

## 6.6 Melo Together / synchronized listening

The repository audit must first establish whether a synchronized listening/session feature already exists and works. If it does, preserve its architecture and improve it rather than creating a duplicate system.

Potential improvements, staged after core V2:

- host creates private room;
- share invite link/code;
- host controls playback;
- guest can request a track or suggest queue additions;
- host can approve/reject queue suggestions;
- reconnect/resume behavior;
- clear host/guest permissions;
- room expiry and abuse limits.

Do not promise frame-perfect or sample-accurate streaming synchronization. Synchronize playback state and timestamps within realistic network tolerance. Avoid collecting location or contact lists. No public room directory until abuse controls and moderation are mature.

## 6.7 Notifications and announcements

- Request Android notification permission only when appropriate (Android versions requiring runtime notification permission).
- Explain notification value before the system prompt.
- Let users manage categories: app updates, important announcements, playlist/community activity, and account/security alerts.
- Store current FCM registration token per installation and Firebase UID association on the backend.
- Handle token rotation using the current Firebase Messaging callback/API.
- Re-register when a token changes or account changes.
- On logout, detach the installation token from that account; do not keep sending personal notifications to a previous user.
- Deep links must open the correct screen safely and validate route identifiers.
- Notifications must not expose private listening information on the lock screen.

## 6.8 App update client

- Keep existing update architecture if reliable; document and extend it.
- Fetch update metadata from backend endpoint.
- Support stable and beta channels if the source already has them and release process can support them.
- Use integer `versionCode` as the authoritative upgrade ordering, not only semantic version strings.
- Show release notes and file size.
- Support optional and mandatory updates; mandatory is only for a defined minimum supported version or critical security issue.
- Provide download progress, retry, pause/resume if the chosen downloader supports it, and a clear install action.
- Verify SHA-256 against the server manifest.
- Check expected package ID and expected signing certificate identity before proceeding; Android's package installer remains the final signature authority.
- Use Android's normal package installer flow and user confirmation.
- Do not request broad storage permissions unnecessarily; use scoped storage / app-specific storage / content URI flow as appropriate.
- Do not attempt silent installation or bypass installation security.
- Retain the last known good release metadata for temporary backend outages.

## 6.9 UI/UX quality

- Keep the existing Melo brand identity.
- Dark mode and Material You support should remain consistent with existing implementation.
- Use the current design system rather than mixing arbitrary component styles.
- New screens must include loading, empty, error, offline, disabled, and success states.
- Support accessibility: semantic labels, touch targets, readable contrast, scalable text, TalkBack, and keyboard behavior where applicable.
- Avoid excessive animation and layout jank on low/mid-range Android devices.
- Use image loading/caching with size-aware requests and placeholders.
- Do not use remote images as a reason to block initial screen rendering.
- Use shimmer/skeleton only where it improves perceived loading and does not distract.
- Add screenshot tests or previews for major new surfaces when feasible.

---

# 7. Backend API requirements (Go)

## 7.1 Responsibilities

The Go API is the single trusted interface between Android/admin and Neon/R2/FCM. It must:

- verify Firebase ID tokens;
- enforce user status and ownership;
- enforce administrator roles;
- validate request bodies and uploaded metadata;
- access Neon with parameterized queries;
- generate R2 presigned URLs;
- send FCM messages using Firebase Admin SDK;
- rate-limit sensitive endpoints;
- produce structured logs and request IDs;
- expose health/readiness endpoints;
- publish an OpenAPI specification;
- record sensitive administrator actions.

## 7.2 Authentication middleware

For protected endpoints:

1. Require `Authorization: Bearer <Firebase ID token>`.
2. Verify token signature, issuer, audience, expiry, and project identity using Firebase Admin SDK.
3. Extract verified Firebase UID.
4. Look up or create the corresponding internal user row (safe idempotent upsert).
5. Check account status (`active`, `suspended`, `banned`, `deletion_pending`).
6. Attach internal user ID and Firebase UID to request context.
7. Reject expired/invalid tokens with `401`.
8. Reject suspended/disabled accounts with a clear `403` error code.

Never trust `user_id`, `firebase_uid`, `role`, `is_admin`, or `owner_id` submitted by a client to authorize an operation.

For admin requests, the backend must check an admin role stored in the Neon database (and optionally mirrored to Firebase custom claims as a cache/optimization). The database-backed role check is authoritative. No client may self-assign an admin role.

## 7.3 API conventions

- Prefix all endpoints with `/v1`.
- Use JSON request/response bodies except binary transfer endpoints.
- Use UTC ISO-8601 timestamps.
- Use UUIDs for internal public resource IDs.
- Paginate list endpoints with cursor-based pagination.
- Use consistent error objects:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A user-friendly explanation.",
    "request_id": "...",
    "details": {}
  }
}
```

- Validate maximum page sizes and payload sizes.
- Use idempotency keys for operations that may be retried.
- Never return SQL errors, secrets, internal stack traces, or raw provider tokens.
- Add API versioning and backward-compatible changes.

## 7.4 Required user endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/v1/health` | Liveness |
| GET | `/v1/ready` | Dependency readiness (avoid leaking internals) |
| GET | `/v1/me` | Current authenticated profile |
| PATCH | `/v1/me` | Update allowed profile fields |
| POST | `/v1/me/username/check` | Username availability |
| POST | `/v1/me/account-deletion` | Request account deletion |
| GET | `/v1/me/export` | Export user-owned metadata |
| GET | `/v1/me/preferences` | Read cloud preferences |
| PUT | `/v1/me/preferences` | Update cloud preferences |
| GET | `/v1/me/library` | Paginated cloud library |
| POST | `/v1/me/library/items` | Add/upsert a saved item |
| DELETE | `/v1/me/library/items/{id}` | Remove a saved item |
| POST | `/v1/sync/push` | Push idempotent local changes |
| GET | `/v1/sync/pull?cursor=...` | Pull changes since server cursor |
| POST | `/v1/me/devices` | Register device metadata/FCM token |
| PATCH | `/v1/me/devices/{id}` | Refresh device/token state |
| DELETE | `/v1/me/devices/{id}` | Detach device from account |
| GET | `/v1/announcements` | Fetch active announcements |
| POST | `/v1/reports` | Submit report |
| GET | `/v1/app/update` | Check app release/channel |

## 7.5 Required playlist/community endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/v1/playlists` | Current user's playlists |
| POST | `/v1/playlists` | Create playlist |
| GET | `/v1/playlists/{id}` | Fetch playlist subject to visibility rules |
| PATCH | `/v1/playlists/{id}` | Update owned playlist |
| DELETE | `/v1/playlists/{id}` | Delete owned playlist |
| PUT | `/v1/playlists/{id}/tracks` | Replace/reorder track list or use granular endpoints |
| POST | `/v1/playlists/{id}/tracks` | Add tracks |
| DELETE | `/v1/playlists/{id}/tracks/{trackId}` | Remove track |
| POST | `/v1/playlists/{id}/follow` | Save/follow playlist |
| DELETE | `/v1/playlists/{id}/follow` | Unfollow playlist |
| POST | `/v1/playlists/{id}/members` | Invite/add collaborator (owner only) |
| PATCH | `/v1/playlists/{id}/members/{userId}` | Change collaborator permission |
| DELETE | `/v1/playlists/{id}/members/{userId}` | Remove collaborator |
| GET | `/v1/community/playlists` | Browse approved public playlists |
| GET | `/v1/community/profiles/{username}` | Fetch public profile |
| POST | `/v1/community/profiles/{userId}/follow` | Follow public profile (later phase) |
| POST | `/v1/community/reports` | Report public content/profile |

Only implement community endpoints in the phase in which their UI and moderation controls are ready. Do not expose incomplete public endpoints accidentally.

## 7.6 Required admin endpoints

All endpoints below require backend-verified admin role and permission checks.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/v1/admin/overview` | Aggregate dashboard metrics |
| GET | `/v1/admin/users` | Search/filter users |
| GET | `/v1/admin/users/{id}` | User details needed for support |
| PATCH | `/v1/admin/users/{id}/status` | Suspend/restore/ban with reason |
| GET | `/v1/admin/reports` | Moderation queue |
| PATCH | `/v1/admin/reports/{id}` | Update report status/action |
| POST | `/v1/admin/announcements` | Create announcement |
| PATCH | `/v1/admin/announcements/{id}` | Edit/schedule/publish |
| DELETE | `/v1/admin/announcements/{id}` | Archive/delete as allowed |
| POST | `/v1/admin/releases` | Create draft release |
| PATCH | `/v1/admin/releases/{id}` | Update release metadata/rollout |
| POST | `/v1/admin/releases/{id}/publish` | Publish release |
| POST | `/v1/admin/releases/{id}/rollback` | Deactivate/roll back release |
| GET | `/v1/admin/feature-flags` | List remote flags |
| PUT | `/v1/admin/feature-flags/{key}` | Update typed flag/config |
| POST | `/v1/admin/uploads/presign` | Create short-lived R2 upload URL |
| POST | `/v1/admin/uploads/complete` | Validate and register uploaded asset |
| GET | `/v1/admin/audit-logs` | Audit trail |
| GET | `/v1/admin/analytics` | Privacy-preserving aggregate analytics |

The admin UI must not call Neon or R2 directly with privileged credentials. It calls the same Go API using Firebase web auth and bearer ID tokens.

---

# 8. Neon PostgreSQL database design

Use Neon PostgreSQL as the only primary application database. Store relational records and metadata, not audio files or large image binaries.

## 8.1 Database design rules

- Use UUID primary keys for internal entities.
- Store Firebase UID as a unique external identity key.
- Use `timestamptz` for timestamps, UTC in the API.
- Add created/updated timestamps and appropriate indexes.
- Use foreign keys and explicit cascade/restrict behavior.
- Add unique constraints for idempotency and ownership rules.
- Use migrations; never modify production schema manually without a migration.
- Use parameterized queries only.
- Add database constraints in addition to API validation.
- Use Neon pooled connection string for normal application traffic where supported; use a direct connection string for migration/administrative work when required by the chosen pooling mode.
- Configure `pgxpool` sensibly; do not create a new DB connection per request.
- Use least-privilege DB roles for runtime and migration operations if practical.

## 8.2 Initial schema proposal

The following is a logical model. The coding agent must adapt it to the audited Room models and implement exact SQL migrations, constraints, indexes, and generated models.

### `users`

- `id UUID PRIMARY KEY`
- `firebase_uid TEXT NOT NULL UNIQUE`
- `email TEXT NULL` (not public)
- `username CITEXT NULL UNIQUE` or equivalent case-insensitive unique index
- `display_name TEXT NULL`
- `bio TEXT NULL`
- `avatar_asset_id UUID NULL`
- `profile_visibility TEXT NOT NULL DEFAULT 'private'` (`private`, `public`)
- `account_status TEXT NOT NULL DEFAULT 'active'` (`active`, `suspended`, `banned`, `deletion_pending`)
- `created_at`, `updated_at`, `last_seen_at TIMESTAMPTZ`
- Add validation for username and bio lengths.

### `user_settings`

- `user_id UUID PRIMARY KEY REFERENCES users(id)`
- `settings JSONB NOT NULL DEFAULT '{}'`
- `notification_preferences JSONB NOT NULL DEFAULT '{}'`
- `listening_history_enabled BOOLEAN NOT NULL DEFAULT FALSE`
- `updated_at TIMESTAMPTZ NOT NULL`

Keep frequently queried settings in typed columns; JSONB is for non-critical extensible preferences only.

### `user_devices`

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES users(id)`
- `device_install_id UUID NOT NULL` (random per installation; not hardware fingerprint)
- `platform TEXT NOT NULL DEFAULT 'android'`
- `app_version_code BIGINT NULL`
- `app_version_name TEXT NULL`
- `device_label TEXT NULL` (user-editable or generic)
- `fcm_token TEXT NULL`
- `notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE`
- `last_seen_at TIMESTAMPTZ NOT NULL`
- `created_at`, `updated_at`
- Unique `(user_id, device_install_id)` and an index on active FCM token where present.
- Never use the FCM token as a permanent device identity.

### `media_assets`

- `id UUID PRIMARY KEY`
- `owner_user_id UUID NULL REFERENCES users(id)`
- `asset_type TEXT NOT NULL` (`avatar`, `playlist_cover`, `announcement_banner`, `admin_asset`)
- `bucket_name TEXT NOT NULL`
- `object_key TEXT NOT NULL UNIQUE`
- `visibility TEXT NOT NULL` (`public`, `private`)
- `content_type TEXT NOT NULL`
- `byte_size BIGINT NOT NULL`
- `width INTEGER NULL`, `height INTEGER NULL`
- `sha256 TEXT NULL`
- `status TEXT NOT NULL` (`pending`, `active`, `rejected`, `deleted`)
- `created_at`, `updated_at`

Do not store R2 secret keys or unnecessary signed query strings. Store object keys and derive public URLs from configured CDN domain when public.

### `user_library_items`

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES users(id)`
- `provider TEXT NOT NULL`
- `provider_item_id TEXT NOT NULL`
- `item_type TEXT NOT NULL` (`track`, `album`, `artist`, `playlist`)
- `title TEXT NOT NULL`
- `artist_name TEXT NULL`
- `album_title TEXT NULL`
- `artwork_source_url TEXT NULL` (metadata only; do not assume ownership)
- `is_liked BOOLEAN NOT NULL DEFAULT FALSE`
- `created_at`, `updated_at`
- Unique `(user_id, provider, item_type, provider_item_id)`.
- Do not store stream URLs, auth cookies, or downloaded audio content.

### `playlists`

- `id UUID PRIMARY KEY`
- `owner_user_id UUID NOT NULL REFERENCES users(id)`
- `title TEXT NOT NULL`
- `description TEXT NULL`
- `visibility TEXT NOT NULL` (`private`, `unlisted`, `public`)
- `cover_asset_id UUID NULL REFERENCES media_assets(id)`
- `is_collaborative BOOLEAN NOT NULL DEFAULT FALSE`
- `revision BIGINT NOT NULL DEFAULT 1`
- `created_at`, `updated_at`, `deleted_at`

### `playlist_tracks`

- `id UUID PRIMARY KEY`
- `playlist_id UUID NOT NULL REFERENCES playlists(id)`
- `provider TEXT NOT NULL`
- `provider_item_id TEXT NOT NULL`
- `title TEXT NOT NULL`
- `artist_name TEXT NULL`
- `album_title TEXT NULL`
- `artwork_source_url TEXT NULL`
- `position_key TEXT NOT NULL` (or an integer/rank strategy designed for stable concurrent reorder)
- `added_by UUID NULL REFERENCES users(id)`
- `created_at`, `updated_at`
- Index `(playlist_id, position_key)`.

### `playlist_members`

- `playlist_id UUID NOT NULL REFERENCES playlists(id)`
- `user_id UUID NOT NULL REFERENCES users(id)`
- `role TEXT NOT NULL` (`editor`, `viewer`)
- `invited_by UUID NULL REFERENCES users(id)`
- `created_at`, `updated_at`
- Primary key `(playlist_id, user_id)`.
- Only the playlist owner can grant/revoke membership.

### `playlist_follows`

- `user_id UUID NOT NULL REFERENCES users(id)`
- `playlist_id UUID NOT NULL REFERENCES playlists(id)`
- `created_at TIMESTAMPTZ NOT NULL`
- Primary key `(user_id, playlist_id)`.

### `user_follows` (later phase)

- `follower_user_id UUID NOT NULL REFERENCES users(id)`
- `followed_user_id UUID NOT NULL REFERENCES users(id)`
- `created_at TIMESTAMPTZ NOT NULL`
- Primary key `(follower_user_id, followed_user_id)`; prohibit self-follow.

### `listening_history` (opt-in)

- `id UUID PRIMARY KEY`
- `user_id UUID NOT NULL REFERENCES users(id)`
- `provider TEXT NOT NULL`
- `provider_item_id TEXT NOT NULL`
- `played_at TIMESTAMPTZ NOT NULL`
- `played_duration_ms BIGINT NULL`
- `device_install_id UUID NULL`
- Index `(user_id, played_at DESC)`.
- Store only if user has enabled history sync. Do not store audio URLs or precise location.

### `sync_mutations` / `sync_events`

Use an idempotent sync ledger. Suggested fields:

- `id BIGSERIAL PRIMARY KEY` as monotonically increasing server cursor;
- `user_id UUID NOT NULL REFERENCES users(id)`;
- `client_mutation_id UUID NOT NULL`;
- `entity_type TEXT NOT NULL`;
- `entity_id UUID NOT NULL`;
- `operation TEXT NOT NULL`;
- `payload JSONB NOT NULL` (strictly validated and size-limited);
- `created_at TIMESTAMPTZ NOT NULL`;
- unique `(user_id, client_mutation_id)`.

The backend should transactionally apply the mutation and append the event. Pull should return a cursor and bounded changes. Document deletion/tombstone behavior so deleted records do not reappear on another device.

### `announcements`

- `id UUID PRIMARY KEY`
- `title TEXT NOT NULL`
- `body TEXT NOT NULL`
- `image_asset_id UUID NULL REFERENCES media_assets(id)`
- `severity TEXT NOT NULL` (`info`, `important`, `critical`)
- `target_channel TEXT NULL`
- `target_min_version_code BIGINT NULL`
- `starts_at`, `ends_at TIMESTAMPTZ NULL`
- `status TEXT NOT NULL` (`draft`, `scheduled`, `published`, `archived`)
- `created_by UUID REFERENCES users(id)`
- `created_at`, `updated_at`

### `app_releases`

- `id UUID PRIMARY KEY`
- `platform TEXT NOT NULL DEFAULT 'android'`
- `channel TEXT NOT NULL` (`stable`, `beta`)
- `version_code BIGINT NOT NULL`
- `version_name TEXT NOT NULL`
- `min_supported_version_code BIGINT NOT NULL`
- `package_name TEXT NOT NULL`
- `artifact_bucket TEXT NULL`
- `artifact_key TEXT NULL`
- `download_url TEXT NULL` (only if using an external release host)
- `sha256 TEXT NOT NULL`
- `signing_cert_sha256 TEXT NOT NULL`
- `file_size_bytes BIGINT NOT NULL`
- `release_notes TEXT NOT NULL`
- `rollout_percentage INTEGER NOT NULL DEFAULT 100`
- `status TEXT NOT NULL` (`draft`, `testing`, `published`, `paused`, `withdrawn`)
- `mandatory BOOLEAN NOT NULL DEFAULT FALSE`
- `published_at`, `created_at`, `updated_at`
- unique `(platform, channel, version_code)`.

The binary may live in a dedicated R2 release-artifact bucket or a dedicated release host. Do not mix APK binaries with public image assets. If using R2 for APKs, use a separate bucket and tighter permissions/lifecycle policy.

### `feature_flags`

- `key TEXT PRIMARY KEY`
- `description TEXT NOT NULL`
- `value JSONB NOT NULL`
- `enabled BOOLEAN NOT NULL DEFAULT FALSE`
- `min_version_code BIGINT NULL`
- `channel TEXT NULL`
- `updated_by UUID REFERENCES users(id)`
- `updated_at TIMESTAMPTZ NOT NULL`

Only expose an allowlisted set of typed, client-safe flags. Never use remote config to download executable code or remotely alter security policy.

### `reports`

- `id UUID PRIMARY KEY`
- `reporter_user_id UUID NULL REFERENCES users(id)`
- `target_type TEXT NOT NULL` (`profile`, `playlist`, `announcement`, `other`)
- `target_id UUID NULL`
- `reason TEXT NOT NULL`
- `details TEXT NULL`
- `status TEXT NOT NULL` (`open`, `reviewing`, `resolved`, `dismissed`)
- `moderator_user_id UUID NULL REFERENCES users(id)`
- `resolution_note TEXT NULL`
- `created_at`, `updated_at`

### `admin_roles`

- `user_id UUID PRIMARY KEY REFERENCES users(id)`
- `role TEXT NOT NULL` (`super_admin`, `content_manager`, `moderator`)
- `created_by UUID NULL REFERENCES users(id)`
- `created_at`, `updated_at`

### `admin_audit_logs`

- `id BIGSERIAL PRIMARY KEY`
- `actor_user_id UUID REFERENCES users(id)`
- `action TEXT NOT NULL`
- `target_type TEXT NULL`
- `target_id TEXT NULL`
- `reason TEXT NULL`
- `request_id TEXT NULL`
- `metadata JSONB NOT NULL DEFAULT '{}'`
- `created_at TIMESTAMPTZ NOT NULL`

Audit log records should be append-only for application roles. Do not store passwords, ID tokens, FCM tokens, R2 signed URLs, or other secrets in logs.

## 8.3 Database security

- Every user-owned query must scope by authenticated internal `user_id`.
- Use explicit authorization checks in backend services; SQL constraints are a second layer, not the only authorization layer.
- Admin and user queries must use different service/repository methods where helpful.
- Do not expose a general-purpose SQL/query endpoint.
- Ensure playlist visibility is enforced server-side.
- Ensure a suspended user cannot continue using community write endpoints.
- Ensure account deletion cleans or anonymizes dependent rows according to the documented retention policy.
- Add indexes for common queries and verify query plans for feed and search pages.
- Set request and query timeouts.

---

# 9. Cloudflare R2 image storage

Use Cloudflare R2 for image/object storage. R2 is S3-compatible; the Go backend uses the AWS SDK for Go v2 configured with the R2 endpoint and region `auto`.

## 9.1 Initial asset types

- user avatars;
- custom playlist covers;
- community playlist artwork;
- announcement banners;
- admin-managed promotional images.

Do not store music/audio files in the image bucket. Do not store private user backups or authentication material in public image storage.

## 9.2 Bucket strategy

At minimum create a dedicated image bucket, for example:

- `melo-images-prod`;
- `melo-images-staging`.

For a larger production setup, separate public assets from private uploads:

- `melo-public-images` — intentionally public avatars (only when profile is public), public playlist covers, published announcement artwork;
- `melo-private-uploads` — pending/private images, if private access is required.

If release APKs are uploaded through admin, use a separate `melo-release-artifacts` bucket; never mix them with images.

Use a custom public image domain/CDN for public assets. For private objects, use short-lived presigned GET URLs. Remember that presigned URLs are bearer links: keep expiry short and never log or share them publicly.

## 9.3 Upload flow

1. Client requests upload intent from authenticated backend.
2. Backend checks user/admin permission, asset type, size limit, and quota.
3. Backend creates a random, non-guessable object key (never trust client-supplied key/path).
4. Backend creates a short-lived presigned PUT URL for exactly that object and permitted content type.
5. Client uploads directly to R2 using the presigned URL.
6. Client calls upload-complete endpoint.
7. Backend verifies object existence, byte size, metadata/content type, and expected key ownership.
8. Backend validates image format and dimensions; reject malformed or disallowed images. Where possible, decode/re-encode images to remove metadata such as EXIF location.
9. Backend marks the asset active and links it to the relevant profile/playlist/announcement.
10. Failed/pending uploads are cleaned up by a scheduled job.

Do not accept arbitrary remote URLs as image uploads. Do not trust filename extensions or client-supplied MIME type by themselves. Allow safe image formats such as JPEG, PNG, and WebP; decide GIF/AVIF only if supported and needed.

Suggested initial limits (adjust after testing):

- avatar: up to 5 MB, square crop, max 2048x2048;
- playlist cover: up to 8 MB, recommended 1:1;
- announcement banner: up to 10 MB, recommended 16:9;
- server validates actual decoded dimensions and size.

## 9.4 Image delivery

- Use a stable public CDN URL for public assets.
- Store `object_key` and asset metadata in Neon; do not make the database dependent on a presigned URL that expires.
- Use image resizing/variants where practical (thumbnail, medium, original).
- Client must display placeholders and gracefully handle missing/deleted assets.
- Private media must not be exposed via a public bucket/domain.
- Set sensible cache-control headers and cache busting by object version/hash.
- Delete orphaned R2 objects safely after checking database references.

## 9.5 R2 secrets and CORS

R2 access key and secret are backend-only secrets. Never include them in BuildConfig, `google-services.json`, web `NEXT_PUBLIC_*` variables, Android resources, source control, or logs. Configure bucket CORS for exact app/admin origins and required methods/headers; do not use unrestricted wildcard CORS for authenticated upload flows.

---

# 10. Firebase Authentication and FCM

## 10.1 Firebase Authentication

Android:

- Add Firebase using the Firebase Android BoM and current compatible Firebase Auth SDK.
- Configure Firebase app IDs and `google-services.json` for development/staging/production.
- Enable only the required providers in Firebase Console.
- Use Google sign-in and email/password initially.
- Use Firebase SDK APIs for sign-in, ID token refresh, sign-out, verification, and password reset.
- Keep authentication state in a single repository/session source of truth.
- Never store passwords manually.
- Do not put Firebase Admin credentials in the app.

Backend:

- Initialize Firebase Admin SDK using an environment-provided service account/workload identity.
- Verify incoming ID tokens on every protected API request (with secure caching only if appropriate and never beyond token validity/revocation policy).
- Derive Firebase UID only from verified token.
- Provide admin-only user disable/delete flows using Firebase Admin SDK where appropriate.
- Consider checking token revocation for high-risk/admin operations.

Web admin:

- Use Firebase Web SDK for sign-in.
- Get an ID token and send it to backend over HTTPS.
- The backend verifies the same way as Android.
- Do not rely on hidden routes or client-side role checks for security.

## 10.2 FCM device lifecycle

- Android integrates Firebase Messaging.
- Obtain the current registration token using the current SDK pattern and handle token refresh.
- Register/update token with backend after user consent and after authentication when associated to an account.
- Backend stores token per installation/user association.
- On logout or account switch, detach prior user association.
- On `UNREGISTERED`/invalid-token response, remove or deactivate token.
- Respect notification preference settings and Android system permission.
- Do not include private track history or sensitive profile content in push payloads.

## 10.3 Notification types

- `announcement`: admin announcement;
- `app_update`: new stable/beta release;
- `important_update`: critical minimum-version notification;
- `playlist_invite`: invitation to collaborative playlist;
- `playlist_activity`: relevant playlist activity (opt-in);
- `security`: account/security notice.

Implement per-category opt-in/out. Support notification collapse keys and deep links. Avoid sending duplicate FCM messages during retries; record campaign/message IDs as needed.

## 10.4 FCM sending

Only the Go backend sends FCM messages using Firebase Admin SDK. The admin dashboard calls backend campaign endpoints. Add:

- audience targeting (all active users, channel, minimum app version, specific user/device where justified);
- dry-run/preview mode;
- rate limiting and batch sends;
- delivery result summary;
- invalid token cleanup;
- admin audit logs;
- explicit confirmation for large or critical sends.

Do not allow arbitrary untrusted user text to become a notification to all users.

---

# 11. Melo Admin Dashboard

Build a separate responsive Next.js + TypeScript application. It is an administrative console, not a public marketing site.

## 11.1 Design direction

- Premium, modern, clean dashboard using Melo brand colors/logo from the repository where licensing permits.
- Dark mode supported; light mode optional but polished.
- Responsive for desktop and tablet.
- Sidebar navigation, compact top bar, clear page hierarchy.
- Use skeletons, empty states, error states, confirmation dialogs, toasts, searchable tables, filters, pagination, and keyboard accessibility.
- Avoid overdecorated gradients, random charts, fake numbers, and generic AI-generated dashboard layouts.
- All displayed statistics must come from real backend endpoints. During development use clearly labeled mock fixtures only.

## 11.2 Navigation

1. Overview
2. Users
3. Playlists / Community
4. Reports & Moderation
5. Announcements
6. App Releases
7. Remote Configuration
8. Notifications
9. Analytics
10. Media Assets
11. Admins & Roles (super-admin only)
12. Audit Logs
13. Settings / System Health

## 11.3 Overview dashboard

Display, based on real database data:

- total registered users;
- active users over defined windows (daily/weekly/monthly) with privacy-conscious aggregation;
- new registrations over time;
- suspended users;
- public playlists count;
- open reports;
- current stable and beta versions;
- update adoption by app version/channel;
- recent admin actions;
- backend/Neon/R2/FCM health summary where available.

Do not show fabricated data. Define each metric precisely in the code and document its calculation window/timezone.

## 11.4 User management

- search by username, internal ID, or email for authorized admins;
- pagination and filters by status/join date;
- user details with minimal data necessary for support;
- account status change with mandatory reason;
- restore/reactivate;
- ban/suspend;
- view registered devices and last app version;
- send account security/support notification where permitted;
- process account deletion request;
- no admin ability to view passwords or authentication secrets.

Moderators should not see private email unless explicitly required by role. Content managers should not receive broad user PII access.

## 11.5 Announcement management

- create/edit draft;
- title, body, image, severity, target channel/version;
- schedule start/end;
- publish/archive;
- preview Android presentation;
- choose whether to send FCM;
- choose audience and notification category;
- preview and test send;
- confirmation before mass send;
- audit all publish and notification operations.

## 11.6 Release management

Admins with release permission can:

- create draft release;
- upload APK artifact to dedicated artifact storage using a presigned upload flow;
- set channel, version code/name, min supported version, release notes, rollout percentage, mandatory flag;
- inspect file size and SHA-256;
- provide expected package name and signing certificate SHA-256;
- publish, pause, withdraw, or roll back a release;
- view adoption/error metrics by version;
- notify users by FCM.

Backend must inspect uploaded artifact metadata where tooling allows and verify its SHA-256. The release must not publish unless required metadata is present and consistent. Android must independently verify downloaded hash and use its package installer. No silent installation.

Rollout percentage should be deterministic for a given installation/user during a release, not randomly change every update check. Do not use intrusive device fingerprinting for rollout assignment.

## 11.7 Remote configuration / feature flags

- typed flags with descriptions, defaults, allowed values, minimum app version, optional channel targeting;
- preview before publish;
- change history and author;
- emergency disable switch for a broken non-core feature;
- app polls config on launch/resume with cache and sensible refresh intervals;
- server defaults remain safe if config fetch fails;
- flags may control UI visibility or opt-in product functionality only;
- never deliver executable code or arbitrary scripts;
- never remotely disable security checks, authentication validation, or core privacy protections.

## 11.8 Admin roles and permissions

| Role | Permissions |
|---|---|
| Super Admin | All dashboard operations; manage roles and system settings |
| Content Manager | Announcements, curated playlists, media, release notes where granted |
| Moderator | Reports, profile/playlist moderation, suspension within granted scope |

- Admins are provisioned by a super admin or one-time secure CLI/bootstrap operation.
- No public “make me admin” endpoint.
- Require strong account security; recommend MFA where available for administrator accounts.
- Backend enforces each permission on every admin endpoint.
- Record admin actions with actor, action, target, time, reason, and request ID.
- Log role grants/revocations.

---

# 12. App releases and update distribution

The app-update system is important because the owner wants to manage releases from the admin panel.

## 12.1 Release workflow

1. Developer builds a signed release APK (and AAB if separately needed for Play distribution).
2. Admin/release manager uploads the APK through the dashboard.
3. Backend validates file type/size and calculates SHA-256.
4. Release manager enters version metadata and release notes.
5. Backend records package name and signing certificate fingerprint.
6. Release remains draft/testing until approved.
7. Admin selects stable/beta channel and rollout percentage.
8. Backend publishes release metadata.
9. Android clients poll update metadata at controlled intervals.
10. Eligible users see update card/notification.
11. User downloads APK, client verifies hash, then opens Android package installer.
12. Client reports successful installed version on next launch; adoption analytics update.

## 12.2 Signing and installation continuity

- Keep the original `applicationId` unless a migration is deliberately planned.
- Preserve the original production signing key and restrict access.
- Keep signing material outside the repository and CI logs.
- Do not silently fall back to debug signing for production builds.
- Fail the release build if expected release signing configuration is missing.
- Keep versionCode strictly increasing for the same package and distribution track.
- Verify downloaded artifact hash and expected signer identity.
- Android's package manager must perform the actual update validation and require user approval as applicable.
- If the upstream signing key cannot be obtained, do not pretend an in-place update is possible. Document distribution/migration options clearly before proceeding.

## 12.3 Release channels

- `stable`: public production users;
- `beta`: opted-in testers;
- optional `nightly`: retain only if existing source supports it and maintenance is justified.

Minimum supported version should be changed only with an explicit reason. Provide a grace period and release notes for forced updates where feasible.

---

# 13. Remote announcements and feature configuration

Admin-managed content must be separate from app releases. Routine banners, announcements, and curated playlist changes must not require publishing a new APK.

## 13.1 Announcement UX

- compact home banner for non-critical announcement;
- inbox/list of active announcements;
- detail screen with optional image and deep link;
- dismiss/mark-read state stored locally or server-side depending on account status;
- expiration and targeting;
- accessible typography and image alt/description.

## 13.2 Feature flags

Suggested initial flags:

- `cloud_sync_enabled`;
- `community_playlists_enabled`;
- `public_profiles_enabled`;
- `collaborative_playlists_enabled`;
- `melo_rooms_enabled`;
- `listening_history_sync_enabled`;
- `new_update_ui_enabled`.

Defaults must be safe. Flags are not substitutes for backend authorization. Even if a feature is hidden in Android, its API endpoints must independently enforce permissions and rollout.

---

# 14. Privacy, security, and safety requirements

Security is a core feature, not final-stage cleanup.

## 14.1 Secrets management

Server-only secrets:

- Neon database URL(s);
- R2 account ID, access key ID, secret access key;
- Firebase service-account/workload identity credentials;
- FCM server-side credentials (through Firebase Admin SDK);
- signing-key references and passwords for release CI (not runtime API);
- backend session/cookie secrets if required by admin hosting.

Client-safe config only:

- Firebase Android config / public project identifiers (not Admin credentials);
- backend base URL;
- public CDN/image domain;
- public app metadata.

Add `.env.example` with placeholders and explicit documentation. Add `.env*`, service-account JSON, `*.keystore`, `*.jks`, `*.p12`, `*.pem`, and release artifacts to ignore rules where appropriate. Run secret scans.

## 14.2 Transport and storage security

- HTTPS only in production.
- Disable cleartext traffic unless a development-only exception is narrowly scoped.
- Use secure Android storage for sensitive tokens/state; do not store secrets in plain preferences or logs.
- Firebase SDK handles auth credential lifecycle; do not persist passwords.
- Restrict admin cookies/session behavior if using cookie-based Next.js sessions.
- Validate CORS for admin API origins.
- Protect against CSRF if cookie auth is used.
- Set appropriate HTTP security headers on the dashboard.
- Validate content type and upload sizes.
- Never trust client-supplied ownership fields.

## 14.3 API security

- Firebase token verification;
- role-based authorization;
- per-user and per-IP rate limits where appropriate;
- brute-force protection through Firebase and API limits;
- strict request size limits;
- input validation and output shaping;
- SQL parameterization;
- request timeouts;
- safe error messages;
- idempotency for mutating actions;
- audit logs for admin operations;
- no open redirect in deep links or update links;
- no arbitrary file fetch/SSRF through image URLs;
- no mass notification endpoint accessible to normal users.

## 14.4 Data minimization and retention

- Cloud history is opt-in.
- Public profile is opt-in.
- Do not collect precise geolocation.
- Do not upload contacts.
- Do not expose email publicly.
- Do not place personal or listening-history details in push notifications.
- Provide account deletion and data export paths.
- Define retention for inactive accounts, reports, audit logs, FCM tokens, and deleted media.
- Document any legally required retention separately.

## 14.5 Community safety

- public profiles disabled by default;
- public playlists reportable;
- blocking/reporting available before broad community rollout;
- moderation queue and audit logs;
- content managers cannot see unnecessary private information;
- no direct messages or open chat in initial release;
- clear community rules and escalation process.

---

# 15. Reliability, performance, and offline behavior

## 15.1 Android

- Playback must remain available when backend is down.
- Search/provider network failures must show useful retry states.
- Cloud sync must run independently from the player service.
- Do not perform long blocking work on the main thread.
- Use WorkManager for deferrable/background sync and retry with constraints.
- Use Coroutines/Flow consistent with current architecture.
- Avoid re-downloading library metadata unnecessarily.
- Paginate long community/user lists.
- Cache public images with size-aware policies.
- Avoid memory leaks in media service, Compose, and lifecycle flows.
- Test on lower-memory and slower Android devices, not only a high-end emulator.

## 15.2 Backend

- Set DB pool limits based on Neon capacity and backend instances.
- Use Neon pooled connection string for request-serving workload where applicable; use direct endpoint for schema migrations when required.
- Use query and request timeouts.
- Add readiness checks for database connectivity without exposing credentials/errors.
- Retry only transient failures and only for idempotent operations.
- Prevent retry storms.
- Use structured logs with request IDs.
- Expose metrics for latency, 4xx/5xx, database pool health, FCM failures, and R2 upload completion failures.

## 15.3 Recovery and backups

- Define Neon backup/PITR options and test restore procedure according to selected plan.
- Keep migrations in source control.
- R2 object lifecycle and backup/versioning strategy must be documented.
- Store no single copy of user-owned metadata only on a developer's machine.
- Test account deletion and restore flows in staging.

---

# 16. Testing and quality gates

No phase is complete because “the screen looks finished.” Each feature must have tests at the right layer.

## 16.1 Android tests

- Unit tests for ViewModels/use cases/repositories;
- Room DAO and migration tests;
- auth state/session tests;
- guest-to-account migration tests;
- cloud sync idempotency/conflict tests;
- offline-mode behavior tests;
- playlist reorder and duplicate tests;
- notification deep-link tests;
- app update version/hash validation tests;
- playback regression tests;
- Compose UI tests for key flows;
- accessibility checks where available.

## 16.2 Backend tests

- Firebase token verification middleware tests;
- unauthorized/forbidden access tests;
- user data isolation tests;
- admin RBAC tests for every role;
- Neon repository/integration tests using a test database/branch;
- migration up/down or forward-compatibility tests;
- sync idempotency and conflict tests;
- R2 presign/upload-complete validation tests;
- FCM invalid token cleanup tests;
- rate-limit tests;
- API schema/contract tests.

## 16.3 Admin tests

- auth and role-gated route tests;
- user management workflows;
- release upload/publish/rollback workflows;
- announcement draft/schedule/publish;
- remote config validation;
- audit log creation;
- responsive and accessibility tests.

## 16.4 End-to-end acceptance scenarios

1. Existing user upgrades the app and retains local library/settings.
2. Existing user chooses “Continue as guest” and can play music without signing in.
3. Guest signs in with Google and merges local library with a new cloud account.
4. User signs in on a second device and sees synced liked songs/playlists.
5. Device goes offline, user changes playlist locally, then reconnects; change syncs without duplicate entries.
6. User changes avatar; upload uses a short-lived presigned URL; R2 asset is attached to profile.
7. Private profile remains inaccessible to other users.
8. Public playlist is visible only after owner opts into public visibility.
9. A moderator cannot access super-admin role management.
10. Admin publishes an announcement and opted-in users receive one notification.
11. Admin publishes a beta update; only eligible beta installations receive it.
12. Android downloads an update, verifies checksum, and opens package installer.
13. Incorrect signing identity/hash is rejected before installation handoff.
14. Backend is unavailable; local playback continues normally.
15. User deletes account; user data follows documented deletion/anonymization policy.

## 16.5 Definition of done

A feature is done only when:

- implementation is complete in the intended architecture;
- loading/empty/error/offline states are implemented;
- authorization and ownership checks exist server-side;
- tests pass and were actually run;
- lint/format checks pass;
- documentation and OpenAPI are updated;
- no secrets are committed;
- no regression is introduced in playback or local data;
- screenshots or a concise verification note are recorded;
- `CHANGELOG.md` and `IMPLEMENTATION_PLAN.md` are updated.

---

# 17. Project structure target

Do not blindly restructure the original Android repository. First map its existing modules and adapt the following target structure to preserve them:

```text
melo-v2/
  app/                    # existing Android application; preserve
  innertube/              # existing provider module; audit/preserve
  lrclib/                 # existing lyrics module; audit/preserve
  betterlyrics/           # existing lyrics module if present
  lastfm/                 # existing metadata/discovery module if present
  kugou/                  # existing provider module if present
  simpmusic/              # existing provider module if present
  kizzy/                  # optional Discord presence module if present
  canvas/                 # existing artwork/visualization module if present
  backend/                # NEW Go REST API
  admin/                  # NEW Next.js admin dashboard
  docs/
    architecture.md
    api.md
    database.md
    security.md
    deployment.md
    feature-inventory.md
  AUDIT_REPORT.md
  IMPLEMENTATION_PLAN.md
  DECISIONS.md
  SECURITY_REVIEW.md
  CHANGELOG.md
  README.md
```

If the current repository has a different layout, keep its established conventions and document the final layout.

---

# 18. Development phases and priorities

## Phase 0 — Acquisition, audit, baseline (mandatory before code changes)

Deliverables:

- cloned upstream repo and exact commit SHA;
- feature inventory with implementation status;
- successful baseline build or documented blockers;
- module/architecture/data-flow report;
- license and provider compliance review;
- signing and package continuity report;
- detailed implementation plan.

Exit criteria: we know what works, what is unsafe/broken, and how to extend it without destroying the existing app.

## Phase 1 — V2 foundation and release safety (P0)

- create clean development branch;
- keep application ID/signing continuity;
- create config/environment separation;
- harden Android network config and secret handling;
- introduce backend Go service skeleton;
- introduce Neon migrations and health/readiness endpoints;
- configure Firebase dev project and token verification;
- add OpenAPI contract and CI checks;
- create admin app skeleton and role-protected routes;
- add logging/request IDs.

Exit criteria: all components can run locally/staging; backend auth can verify a real development Firebase token; Android baseline still works.

## Phase 2 — Authentication and profile (P0)

- Firebase Google and email/password sign-in;
- local guest mode;
- backend identity/profile upsert;
- profile setup/edit;
- sign-out, verification/reset, delete request;
- user status enforcement;
- admin bootstrap and role model.

Exit criteria: users can use Melo without an account; registered users can sign in; backend correctly identifies and authorizes the user.

## Phase 3 — Cloud library sync (P0)

- map Room models to sync DTOs;
- implement schema and sync ledger;
- implement push/pull cursor flow;
- implement idempotency and deletion tombstones;
- guest-to-account merge;
- cloud playlists and settings;
- sync status UI and manual sync;
- multi-device and offline tests.

Exit criteria: library survives sign-in on a second device and offline edits converge without data loss or duplicates.

## Phase 4 — R2 assets and FCM (P0)

- create image bucket(s);
- implement presigned uploads;
- asset metadata and completion validation;
- avatar and playlist cover UI;
- Firebase Messaging integration;
- token lifecycle and notification preferences;
- admin announcement delivery.

Exit criteria: image upload works without exposing R2 credentials; notifications target correct accounts/devices and honor preferences.

## Phase 5 — Admin management and app releases (P0)

- admin overview;
- users and status management;
- announcements;
- release uploads/metadata/publish/rollback;
- stable/beta channel selection;
- feature flags;
- audit logs;
- FCM campaign preview/send;
- Android update UI and verification.

Exit criteria: an authorized admin can publish an announcement and release from the dashboard; client checks and safely presents update.

## Phase 6 — Community (P1)

- public/private/unlisted playlists;
- sharing links;
- profiles with privacy choices;
- playlist following;
- collaboration permissions;
- reports/moderation;
- abuse controls and admin workflows.

Exit criteria: community interactions have clear visibility/ownership rules, user reporting, and moderator capability.

## Phase 7 — Melo Together improvement and advanced discovery (P1/P2)

Only after verifying the existing implementation:

- improve room stability and invitations;
- queue suggestions/voting;
- reconnect behavior;
- community charts and opt-in aggregate trends;
- weekly discovery/smart mixes if they can be grounded in lawful provider metadata and privacy-respecting signals;
- improved listening recap.

Exit criteria: optional features do not compromise core listening, performance, or privacy.

## Phase 8 — Hardening and production rollout

- security review and dependency audit;
- database backup/restore rehearsal;
- R2 lifecycle/orphan cleanup test;
- release signing/upgrade test from previous public version;
- staged beta rollout;
- crash-free/playback regression monitoring;
- performance/accessibility tests;
- privacy policy, terms, community rules, and support instructions;
- production runbook and rollback plan.

Exit criteria: signed upgrade works for existing users, no data loss, critical tests pass, admins are provisioned securely, and production monitoring is active.

---

# 19. Priority matrix

| Priority | Feature | Target |
|---|---|---|
| P0 | Full upstream audit and baseline build | Before development |
| P0 | Preserve existing player, package ID, signing identity | Every phase |
| P0 | Go backend + Neon schema/migrations | Foundation |
| P0 | Firebase Auth (Google + email/password) and guest mode | First V2 release |
| P0 | User profiles and account lifecycle | First V2 release |
| P0 | Cloud library sync and guest migration | First V2 release |
| P0 | R2 avatar/playlist/announcement images | First V2 release |
| P0 | FCM token lifecycle and user preferences | First V2 release |
| P0 | Admin dashboard, users, announcements | First V2 release |
| P0 | Admin-managed app releases and safe client updater | First V2 release |
| P0 | Remote feature flags and audit logs | First V2 release |
| P1 | Public/private playlists and sharing | Follow-up release |
| P1 | Collaborative playlists | Follow-up release |
| P1 | Moderation/reporting | Before public community expansion |
| P1 | Melo Together improvements | Follow-up release after source audit |
| P2 | Follow users, community charts, weekly discovery | Later release |
| P2 | Android Auto/widgets/Wear OS/desktop companion | Later release |

---

# 20. Required deliverables from the coding agent

The agent must deliver actual implementation, not only a plan. Final handoff must include:

### Android

- updated source code;
- retained working features;
- Firebase auth integration;
- cloud sync and migration;
- profile/community UI as phased;
- FCM integration;
- app update integration;
- Room migrations;
- tests and build output;
- signed-build instructions (never include real private signing material).

### Backend

- Go service source;
- Neon migrations;
- repository/query layer;
- Firebase Auth verification;
- R2 upload/presign service;
- FCM sending service;
- user/library/playlist/admin endpoints;
- OpenAPI spec;
- tests;
- `.env.example`;
- deployment guide.

### Admin

- Next.js source;
- Firebase web sign-in;
- role-protected dashboard;
- user management;
- announcements;
- releases;
- feature flags;
- media upload;
- reports/audit logs;
- tests and deployment guide.

### Documentation and operations

- `AUDIT_REPORT.md`;
- `IMPLEMENTATION_PLAN.md`;
- `DECISIONS.md`;
- `SECURITY_REVIEW.md`;
- `CHANGELOG.md`;
- `docs/architecture.md`;
- `docs/database.md`;
- `docs/api.md`;
- `docs/deployment.md`;
- `docs/backup-and-restore.md`;
- `docs/release-runbook.md`;
- `docs/admin-guide.md`;
- known limitations and follow-up issues.

---

# 21. Configuration checklist for the project owner

The coding agent should create exact setup instructions and `.env.example` placeholders. It must not ask for all credentials before beginning the audit or building local scaffolding.

## Firebase

Owner will eventually need to:

- create/select Firebase project(s) for dev and production;
- add Android application using the exact existing application ID;
- register admin web application;
- download `google-services.json` for Android into the correct ignored local path;
- enable Google and Email/Password providers;
- configure Google OAuth consent/authorized domains as required;
- create service-account/workload identity credentials for backend Admin SDK;
- configure FCM for Android;
- set up SHA fingerprints required by Google sign-in.

## Neon

Owner will eventually need to:

- create development and production projects/branches;
- create runtime and migration database roles with least privilege;
- provide pooled connection string for normal application requests;
- provide direct migration connection string where needed;
- configure backups/retention appropriate to production;
- set allowed network access policy if configured.

## Cloudflare R2

Owner will eventually need to:

- create image buckets for staging and production;
- create separate release artifact bucket if admin APK upload uses R2;
- create least-privilege R2 API credentials;
- configure custom domain for public images;
- configure CORS for exact web origins and upload headers;
- set cache rules and lifecycle/orphan cleanup policy;
- keep account ID, access key, and secret only in backend deployment secrets.

## Deployment

Select a host for the Go API and Next.js dashboard. The coding agent should make the apps deployable with Dockerfiles or the platform's standard deployment configuration. Do not hard-code one hosting vendor unless the owner has selected it.

---

# 22. Suggested environment variables

Create `.env.example` files with placeholders only. Names may be refined, but do not leak values.

### Backend `.env.example`

```dotenv
APP_ENV=development
APP_PORT=8080
PUBLIC_API_BASE_URL=http://localhost:8080
LOG_LEVEL=debug

# Neon PostgreSQL
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
DATABASE_URL_DIRECT=postgresql://USER:PASSWORD@DIRECT_HOST/DB?sslmode=require

# Firebase Admin SDK - use secure credential file/workload identity, never commit it
FIREBASE_PROJECT_ID=replace-me
GOOGLE_APPLICATION_CREDENTIALS=/secure/path/firebase-service-account.json

# Cloudflare R2
R2_ACCOUNT_ID=replace-me
R2_ACCESS_KEY_ID=replace-me
R2_SECRET_ACCESS_KEY=replace-me
R2_IMAGES_BUCKET=melo-images-dev
R2_RELEASES_BUCKET=melo-releases-dev
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_IMAGE_BASE_URL=https://images.example.com
R2_PRESIGN_TTL_SECONDS=300

# Security / operations
ALLOWED_ADMIN_ORIGINS=http://localhost:3000
RATE_LIMIT_ENABLED=true
```

### Admin `.env.local.example`

```dotenv
NEXT_PUBLIC_APP_NAME=Melo Admin
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=replace-with-public-firebase-web-config
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=replace-me.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=replace-me
NEXT_PUBLIC_FIREBASE_APP_ID=replace-me
```

Firebase web configuration values are client config, not Admin SDK secrets. Do not put a Firebase service-account key, Neon URL, or R2 secret in this file.

### Android configuration

Use build variants/flavors or secure local configuration for:

- Firebase app config;
- backend base URL;
- image CDN base URL;
- development/staging/production environment selection.

Do not put backend secrets or database/storage credentials in Android `BuildConfig` or resources.

---

# 23. Success metrics

Measure outcomes without collecting unnecessary personal data.

- percentage of existing users who upgrade without losing local data;
- percentage of registered users with successful first sync;
- sync success/error rate and median sync duration;
- crash-free sessions and playback failure rate;
- time to first playable track (must not regress materially);
- Android update adoption by release/channel;
- invalid FCM token rate;
- R2 upload completion/failure rate;
- admin action success/failure;
- report resolution time;
- user account deletion completion rate.

Do not optimize for maximum data collection. Listening analytics/history must remain opt-in and transparent.

---

# 24. Final execution order

Follow this exact sequence:

1. Check the workspace and preserve existing user files.
2. Clone `https://github.com/techxsarwar/melo.git` into `melo-v2` if not already present.
3. Record current commit and branch.
4. Inspect every module and every relevant file.
5. Build and run the original project without modifications.
6. Write `AUDIT_REPORT.md` and feature matrix.
7. Confirm application ID, signing key availability, versioning, current updater, Room schema, and music-provider risk.
8. Write `IMPLEMENTATION_PLAN.md` and `DECISIONS.md`.
9. Create the Go backend, Neon migrations, API contract, Firebase verification, R2 integration, and FCM service.
10. Add Android auth and guest mode without breaking the existing player.
11. Add cloud sync and guest migration with tests.
12. Add admin dashboard with backend-enforced permissions.
13. Add image uploads and announcement/FCM workflow.
14. Add admin-managed release workflow and safe Android update client.
15. Add community features only after privacy, reporting, and moderation foundations are ready.
16. Run all tests, lint, security checks, upgrade tests, and playback regression tests.
17. Update documentation and produce a final handoff report with real build commands and results.

**The most important instruction:** preserve the reason people already use Melo. V2 should make the original app more reliable, personal, connected, and manageable—not slower, heavier, or harder to use. Build the new platform around the proven music experience, and never sacrifice local playback for account or cloud features.

---

# 25. Technical references

Use current official documentation and verify compatibility before adding dependencies:

- Melo upstream source: https://github.com/techxsarwar/melo
- Firebase Authentication on Android: https://firebase.google.com/docs/auth/android/start
- Firebase Authentication overview: https://firebase.google.com/docs/auth
- Verify Firebase ID tokens on backend: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Firebase Admin SDK setup: https://firebase.google.com/docs/admin/setup
- Firebase Cloud Messaging Android: https://firebase.google.com/docs/cloud-messaging/android/get-started
- Cloudflare R2 S3 compatibility: https://developers.cloudflare.com/r2/get-started/s3/
- Cloudflare R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Cloudflare R2 uploads: https://developers.cloudflare.com/r2/objects/upload-objects/
- Neon connection guide: https://neon.com/docs/get-started/connect-neon
- Neon connection pooling: https://neon.com/docs/connect/connection-pooling

Check current official documentation for SDK versions, Android requirements, token lifecycle, R2 limitations, and Neon connection behavior at implementation time. Do not copy stale version numbers from this PRD.

---

**End of Melo V2 Master PRD.**
