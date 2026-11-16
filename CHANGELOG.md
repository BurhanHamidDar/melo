# Melo V2 — Changelog

## [2.0.0-dev] - 2026-11-15

### Phase 1: Security Hardening & Architecture Realignment
- **Removed Supabase completely from Android client:**
  - Deleted `app/src/main/kotlin/com/nikhil/yt/TodoActivity.kt`
  - Removed `TodoActivity` from `AndroidManifest.xml`
  - Removed `io.github.jan-tennert.supabase:postgrest-kt` dependency from `app/build.gradle.kts`
  - Replaced `SupabaseUrlKey` and `SupabaseAnonKey` in `PreferenceKeys.kt` with `MeloApiBaseUrlKey` and `FirebaseAuthTokenKey`
  - Cleaned all direct Supabase queries (`active_sessions`, `app_updates`, `broadcast_notifications`) from `MainActivity.kt`
  - Replaced `SupabaseModels.kt` with clean serializable `RemoteModels.kt`
- **Removed In-App Admin Panel:**
  - Deleted `app/src/main/kotlin/com/nikhil/yt/ui/screens/settings/AdminPanelScreen.kt`
  - Removed "Admin & Developer Panel" entry from `SettingsScreen.kt`
  - Removed "Admin Login" action button from `LoginScreen.kt`
  - Removed `"settings/admin"` route and import from `NavigationBuilder.kt`
- **Added Firebase Authentication & Cloud Messaging to Android:**
  - Added `com.google.firebase:firebase-bom:33.7.0`
  - Added `com.google.firebase:firebase-auth`
  - Added `com.google.firebase:firebase-messaging`
- **Standalone Web Admin Dashboard (Next.js 15 + TypeScript):**
  - Fully scaffolded and compiled in `admin/`
  - Implemented responsive dark UI with Tailwind CSS
  - Routes: `/` (Overview), `/users` (User Moderation), `/releases` (App Releases), `/announcements` (Announcements), `/audit-logs` (Audit Trail)
  - Verified static generation (`next build` succeeded with 8 static routes)
- **Standalone Backend REST API (Go 1.25):**
  - Implemented in `backend/` with Go 1.25, `net/http`, `pgxpool`, and `google/uuid`
  - Neon PostgreSQL initial migration schema created in `backend/migrations/00001_initial_schema.sql`
  - Endpoints implemented: `/v1/health`, `/v1/ready`, `/v1/me`, `/v1/me/username/check`, `/v1/sync/push`, `/v1/sync/pull`, `/v1/app/update`, `/v1/announcements`, `/v1/uploads/presign`, `/v1/uploads/complete`, `/v1/admin/*`
  - Unit tests verified and passing (`ok github.com/melo-v2/backend/internal/http/handlers 1.488s`)
  - OpenAPI 3.1 specification written in `docs/openapi.yaml`
- **Android Compilation & Verification:**
  - 19 unit tests executed and passed (`testUniversalDebugUnitTest` - 100% pass)
  - Built `universalDebug` APK (`assembleUniversalDebug` - `BUILD SUCCESSFUL in 5m 59s`)

### Phase 2: Neon DB Migration & Package Renaming
- **Application ID Migration to `com.music.melo`:**
  - Updated `applicationId = "com.music.melo"` in `app/build.gradle.kts`
  - Updated XML shortcuts in `app/src/main/res/xml-v25/shortcuts.xml`
  - Updated default package name in `backend/migrations/00001_initial_schema.sql` and `backend/internal/http/handlers/releases.go`
  - Recorded ADR-006 in `DECISIONS.md`
- **Neon PostgreSQL Integration & Migration:**
  - Connected Go migration runner to live Neon database pool (`ep-fragrant-forest-ao5ittzg`)
  - Successfully executed `00001_initial_schema.sql`
  - Verified 17 tables created in Neon PostgreSQL (`users`, `user_library_items`, `playlists`, `playlist_tracks`, `listening_history`, `app_releases`, `announcements`, `admin_roles`, `admin_audit_logs`, etc.)
  - Added native `.env` loading to `backend/internal/config/config.go`
  - Passed database integration test in `backend/internal/database/database_test.go`
- **Firebase Documentation & Tooling:**
  - Extracted local debug keystore SHA-1 & SHA-256 fingerprints
  - Authored comprehensive setup guide in `FIREBASE_SETUP_GUIDE.md` for `com.music.melo`

### Phase 3: Cloudflare R2 Storage & Production Firebase Wiring
- **Cloudflare R2 Integration:**
  - Configured R2 credentials, account ID, bucket (`melo-images`), and public distribution domain (`https://pub-65f5c567634e486682c0d063bc40dd16.r2.dev`) in `backend/.env`
  - Created `backend/internal/storage/r2.go` utilizing AWS S3 SDK v2 for Go
  - Implemented presigned PUT URL generator for user avatars, playlist artwork, and banners
  - Verified live end-to-end integration test (`TestR2PresignPutURLAndUpload`): generated presigned URL, executed HTTP PUT upload to Cloudflare R2 (HTTP 200), and retrieved the uploaded payload via public domain
- **Firebase Wiring:**
  - Confirmed Android configuration in `app/google-services.json`
  - Confirmed Backend service account private key in `backend/firebase-service-account.json`
  - Wired Firebase Web credentials in `admin/.env.local`
  - Built Next.js admin dashboard production bundle cleanly

### Phase 4: Android Cloud Sync, Firebase Auth, FCM & Asset Uploads
- **Firebase Authentication on Android:**
  - Implemented `MeloAuthRepository.kt` with reactive `AuthState` flow (Guest / Loading / Authenticated / Error)
  - Integrated email/password sign-in, registration, and automatic token refresh
  - Connected background profile synchronization with backend `/v1/me`
- **Cloud Library Sync:**
  - Implemented `MeloCloudSyncManager.kt` with transactional sync logic
  - Pushes liked tracks and playlist changes to `/v1/sync/push`
  - Pulls remote mutations via `/v1/sync/pull?cursor=...` and reconciles with Room `MusicDatabase`
  - Reconciles `SongEntity` and `PlaylistEntity` with deterministic conflict resolution
- **Push Notifications (FCM):**
  - Implemented `MeloFirebaseMessagingService.kt` handling announcements and app release push notifications
  - Connected `onNewToken` to automatic device registration with backend `/v1/me/devices`
  - Registered FCM service in `AndroidManifest.xml`
- **Cloudflare R2 Image Uploads on Android:**
  - Implemented `MeloUploadManager.kt` orchestrating presigned PUT URL generation (`/v1/uploads/presign`), direct binary upload to Cloudflare R2, and upload completion verification (`/v1/uploads/complete`)
- **Safe In-App Updater:**
  - Implemented `MeloUpdater.kt` querying `/v1/app/update`
  - Enforced SHA-256 verification and package name validation before triggering package installation
- **Account Settings UI:**
  - Implemented `MeloAccountScreen.kt` in Material 3 Compose with Guest explanation, Sign In/Up dialogs, sync state, and "Sync Now" button
  - Added "Melo Cloud & Backup" entry to `VeluneSettingsScreen.kt` and `"settings/melo_account"` route to `NavigationBuilder.kt`
- **Verification & Test Suite:**
  - 25 unit tests executed and passed (`testUniversalDebugUnitTest` - 100% success rate, 0 failures)
  - Built production debug APK (`app-universal-debug.apk`, 53.2 MB, SHA-256: `5CAAFD59EFC01B4920EC86A3F2FBC21D4DDA6C8647F55B6CE3A054802EB36692`)

### Phase 5: Web Admin Dashboard Firebase Integration & Release Management
- **Firebase Web Authentication:**
  - Installed official `firebase` Web SDK in `admin/`
  - Initialized Firebase client in `admin/src/lib/firebase.ts` with web credentials
  - Created dedicated `/login` page supporting both Email/Password and Google sign-in
  - Attached verified Firebase ID token to all backend REST requests
- **Backend Device Registration:**
  - Implemented `POST /v1/me/devices` (upsert device installation, platform, app version, FCM token, notification preferences)
  - Implemented `DELETE /v1/me/devices/{install_id}`
  - Verified Go test suite passing across all database, storage, and handler packages
- **Next.js 15 Admin Dashboard Compilation:**
  - Production build `next build` executed with 0 errors
  - Statically generated 9 routes: `/`, `/login`, `/users`, `/releases`, `/announcements`, `/audit-logs`, etc.

### Phase 6: Community, Playlists & Moderation
- **Playlists & Collaboration Endpoints (Go Backend):**
  - Implemented `backend/internal/http/handlers/playlists.go`
  - Routes: `POST /v1/playlists`, `GET /v1/playlists/{id}`, `PATCH /v1/playlists/{id}`, `DELETE /v1/playlists/{id}`, `POST /v1/playlists/{id}/tracks`, `DELETE /v1/playlists/{id}/tracks/{trackId}`, `PUT /v1/playlists/{id}/tracks/order`, `POST /v1/playlists/{id}/follow`, `DELETE /v1/playlists/{id}/follow`, `GET /v1/playlists/{id}/members`, `POST /v1/playlists/{id}/members`, `PATCH /v1/playlists/{id}/members/{userId}`, `DELETE /v1/playlists/{id}/members/{userId}`
  - Implemented `hasEditPermission` verifying owner and collaborative editor permissions
  - Enforced monotonic position keys and revision increments on track operations
- **Community & Moderation Reports Endpoints:**
  - Implemented `backend/internal/http/handlers/community.go`
  - Routes: `GET /v1/community/playlists`, `GET /v1/community/profiles/{username}`, `POST /v1/community/reports`, `POST /v1/reports`, `GET /v1/admin/reports`, `PATCH /v1/admin/reports/{id}`
  - Added unit test suite `backend/internal/http/handlers/playlists_test.go` (`TestPlaylistAndCommunityHandlers` passed)
- **Web Admin Moderation Queue:**
  - Added Moderation Reports page at `admin/src/app/reports/page.tsx`
  - Status filtering: `all`, `open`, `reviewing`, `resolved`, `dismissed`
  - Action modal for updating status with optional moderation notes
  - Updated `admin/src/components/Sidebar.tsx` navigation
  - Re-compiled Next.js production build (`10/10` static pages passed)
- **Android Client Playlist Sharing & Reporting:**
  - Updated `PlaylistEntity.kt` to generate Melo deep/web share links (`https://melo-v2.firebaseapp.com/playlist/$id`) for custom playlists
  - Created Material 3 `ReportContentDialog.kt` in `com.nikhil.yt.ui.component`
  - Added flag vector drawable `flag.xml` and report strings in `strings.xml`
  - Connected "Report" action item to `PlaylistMenu.kt`

### Phase 7: Playback & Hardening Verification
- Fixed baseline unit test failure in `TogetherGuestPlaybackPlannerTest`
- Ran full unit test suite across Android (`testUniversalDebugUnitTest`), Go backend (`go test -v ./...`), and Admin dashboard (`npm run build`)
- All 25 Android unit tests, 100% of Go backend tests, and all Next.js static pages passing

### Phase 8: System Runbooks & Production Documentation
- Authored comprehensive documentation in `docs/`:
  - `docs/architecture.md`: High-level system design, data flows, and security boundaries
  - `docs/database.md`: Neon PostgreSQL relational schema, constraints, indexes, and migrations
  - `docs/api.md`: Go REST API v1 conventions, auth headers, error envelopes, and complete endpoints catalog
  - `docs/deployment.md`: Docker multi-stage build, cloud environment variables, CORS, and deployment guidelines
  - `docs/release-runbook.md`: Step-by-step app release publication, SHA-256 verification, and rollback procedures
- Updated OpenAPI 3.1 contract in `docs/openapi.yaml`
- Updated `IMPLEMENTATION_PLAN.md` with complete phase status
