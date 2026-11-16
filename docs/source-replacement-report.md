# Melo V2 Source Replacement & Phase 2 Integration Report

## 1. Executive Summary

This report documents the completed replacement of the obsolete Melo codebase with the colleague-modified Melo source tree (`https://github.com/techxsarwar/melo.git`, commit `21e45746`), alongside the initial integration of Firebase authentication, cloud messaging, and iOS-styled authentication user interfaces.

All work has been executed strictly following the directives of the **MELO REPLACEMENT AND ADMIN PLATFORM MASTER PRD** and user specifications:
1. **Preservation of Existing Modified Features:** Zero regressions or changes to the colleague's audio streaming pipeline, 13 metadata/lyrics providers, native AAudio/USB DAC C++ engine (`libmochypass.so`), DSP processing, or existing UI aesthetics.
2. **iOS-Style Native Auth UI:** Created dedicated login and account management screens adhering strictly to the colleague app's design language (`InterFontFamily`, `Color(0xFF1C1C1C)` dark background, `Color(0xFF2C2C2C)` tactile card surfaces, smooth spring animations, and `PopupSheetState`).
3. **Guest Mode Invariant:** Playback, search, streaming, and local caching operate without requiring account sign-in. Authentication is entirely optional for cloud library backup and sync.
4. **App Identity Alignment:** Package identity configured as `com.music.melo` with matching `google-services.json`.

---

## 2. Source Transition & Workspace Restructuring

### 2.1 Pre-Replacement Backup (Phase 0)
Prior to making any modifications to the workspace, an isolated, read-only full backup of the existing workspace was created at:
- **Backup Location:** `C:\Users\Burhan\Downloads\melo-v2-backup-20261116-phase0`
- **Integrity Verification:** 1,939 files, 314 folders preserved.

### 2.2 Upstream Baseline Verification (Phase 1)
The colleague repository was cloned cleanly to `C:\Users\Burhan\Downloads\melo-new-source`:
- Upstream Commit: `21e45746b41d279761f0f430545f0ba4c95f0c43`
- Untouched Build Command: `.\gradlew assembleUniversalFossDebug`
- Verification Result: **BUILD SUCCESSFUL** (APK: 64,156,942 bytes).
- Native Components Verified: C++ CMake target `mochypass` compiling AAudio and USB audio drivers with Android NDK 27.

### 2.3 Active Workspace Replacement (Phase 2)
1. **Source Migration:** The colleague source tree (`app/`, `providers/`, `modules/`, `gradle/`, `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`) was transferred into `C:\Users\Burhan\Downloads\Melo-v2`.
2. **Obsolete Source Purge:** All obsolete root-level provider directories from the old implementation were removed to ensure zero conflicts.
3. **Platform Persistence:** The Go backend (`backend/`), Next.js Web Admin dashboard (`admin/`), database migration scripts (`infra/db/`), documentation (`docs/`), and PRDs (`new/`) were preserved intact.

---

## 3. App Identity, Firebase & Android Configuration

### 3.1 Package Identity
- **Application ID:** `com.music.melo` (Debug variant: `com.music.melo.debug`)
- **Android Namespace:** `com.mochyy.mochymusic`
- **Google Services Configuration:** Registered `google-services.json` containing OAuth 2.0 client IDs and client certificates placed at `app/google-services.json`.

### 3.2 Dependency Matrix Updates
In `gradle/libs.versions.toml`:
- `google-services` plugin: `4.4.2`
- `firebase-bom`: `33.7.0`
- `firebase-auth` (via BoM)
- `firebase-messaging` (via BoM)
- `play-services-auth`: `21.3.0`

In `settings.gradle.kts`:
- Explicit repository resolution configured in `pluginManagement`:
  ```kotlin
  pluginManagement {
      repositories {
          google()
          mavenCentral()
          gradlePluginPortal()
      }
  }
  ```

---

## 4. UI/UX & Integration Implementation

### 4.1 iOS-Style Auth Components Created
All new auth components follow the colleague app's design tokens and interaction physics:
- **`MeloLoginScreen.kt`** (`com.mochyy.mochymusic.ui.screens.auth`):
  - Supports Email/Password authentication, New Account registration, and Google Sign-In.
  - Tactile scale effect on press (`Modifier.scale(buttonScale)`).
  - Matches dark theme (`Color(0xFF1C1C1C)` background, `Color(0xFF2C2C2C)` card containers, `Color(0xFF383838)` borders).
  - Clear "Continue as Guest" escape action.
- **`MeloAccountSheet.kt`**:
  - Modal bottom sheet displaying active user profile, UID, email, sync status, and one-tap sign out.
- **`MeloAuthViewModel.kt`**:
  - Exposes reactive `MeloAuthState` (Unauthenticated, Loading, Authenticated, Error).
  - Dispatches Firebase tokens and manages account lifecycle.
- **`MeloAuthRepository.kt`**:
  - Encapsulates `FirebaseAuth` client calls, Google credential sign-in, and listener state flow.

### 4.2 Push Notifications Client
- **`MeloFirebaseMessagingService.kt`** (`com.mochyy.mochymusic.core.fcm`):
  - Handles incoming background/foreground push messages.
  - Creates dedicated notification channel (`melo_announcements`, high importance).
  - Automatically captures FCM registration token for backend synchronization.
  - Registered in `AndroidManifest.xml`.

### 4.3 Navigation & Settings Hooks
- Registered `"melo_login"` destination in `NavigationBuilder.kt`.
- Added iOS-styled "Melo Account & Sync" preference tile in `MochySettingsScreen.kt`.
- Added user account pill in `UserProfilePage.kt` leading directly to login or account management.

---

## 5. Verification Checklist

| Item | Status | Details |
|------|--------|---------|
| Full Phase 0 Backup | Verified | Stored at `melo-v2-backup-20261116-phase0` |
| Upstream Clean Baseline | Verified | 64MB Universal FOSS Debug APK built |
| Active Source Replacement | Complete | New codebase active in `Melo-v2` |
| Audio/Streaming Preservation | Preserved | Zero modifications to player, decoders, or providers |
| UI Aesthetic Preservation | Preserved | Exact color tokens, typography, and tactile pill styling |
| Package ID Alignment | Complete | `applicationId = "com.music.melo"` |
| Firebase Client Integration | Complete | Auth BoM, FCM service, and Google Services plugin configured |
| Guest Mode Integrity | Verified | Default mode requires no login |
