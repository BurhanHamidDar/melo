# Repository Audit Report — Colleague-Modified Melo

**Audit Date:** 2026-11-16  
**Source Repository:** `https://github.com/techxsarwar/melo.git`  
**Inspected Commit:** `21e45746bf6f8f5c56a986102e0ba9726ab2490d`  
**Commit Message:** `feat(branding): replace all remaining Mochy occurrences with Melo across all screens and translations`  
**Local Verification Path:** `C:\Users\Burhan\Downloads\melo-new-source`  
**Phase:** Phase 1 Deliverable  

---

## 1. Executive Summary

This document presents the complete architectural and structural audit of the colleague-modified Melo Android repository (`techxsarwar/melo`). The codebase represents a modern, highly refined music streaming client featuring a sleek iOS-inspired design system, advanced audio features (direct USB driver and AAudio exclusive mode), and modular architecture.

Per user requirements:
1. **Preserve All Existing Features:** No music playback, lyrics, equalizer, or provider features shall be modified or broken.
2. **Preserve UI Aesthetics:** The existing iOS design language (Inter font, dark charcoal containers, smooth rounded sheet modals, tactile pill buttons) must be preserved intact.
3. **Dedicated Authentication UI:** New authentication screens (Email/Password, Google Sign-In, and Guest fallback) must directly adopt and extend the existing iOS design system.

---

## 2. Project & Build Configuration

| Component | Specification / Value | Notes |
| :--- | :--- | :--- |
| **Namespace** | `com.mochyy.mochymusic` | Source packages under `com/mochyy/mochymusic` |
| **Application ID** | `com.melo.music` | Production application identity |
| **Application ID (Debug)** | `com.melo.music.debug` | Suffix `.debug` |
| **Version Code** | `73` | Build #1256 |
| **Version Name** | `8.4.1 build#1256` | SemVer with build metadata |
| **Compile SDK** | `35` (Android 15) | |
| **Target SDK** | `35` (Android 15) | Full Android 15 16KB page alignment |
| **Min SDK** | `24` (Android 7.0) | Backward compatibility |
| **Kotlin Version** | `2.1.0` | Compose Compiler plugin |
| **AGP Version** | `8.7.3` | Android Gradle Plugin |
| **Gradle Distribution** | `8.11.1` | Wrapper configured |
| **Java Requirement** | JDK 21 (Temurin 21.0.13+9) | `org.gradle.java.home` configured |
| **NDK Version** | `27.0.12077973` | Required for native audio engine |
| **CMake Version** | `3.22.1` | `src/main/cpp/CMakeLists.txt` |

---

## 3. Build Flavor Matrix

The repository defines two orthogonal flavor dimensions:

### 3.1 Dimension: `abi`
- `universal`: All ABIs included (`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`).
- `arm64`: 64-bit ARM (`arm64-v8a`).
- `armeabi`: 32-bit ARM (`armeabi-v7a`).
- `x86`: 32-bit Intel (`x86`).
- `x86_64`: 64-bit Intel (`x86_64`).

### 3.2 Dimension: `variant`
- `foss`: 100% Free and Open Source variant. Excludes proprietary Google Play Services dependencies.
- `fdroid`: Tailored for F-Droid packaging and reproducible builds.
- `gms`: Google Mobile Services enabled (Firebase Auth, Cloud Messaging, Google Play In-App Updates).

**Standard CI/Debug Target:** `assembleUniversalFossDebug` / `assembleUniversalGmsDebug`.

---

## 4. Native Engine Architecture (`mochypass`)

- **Location:** `app/src/main/cpp/`
- **Engine Name:** `libmochypass.so`
- **Source Files:**
  - `usb_pass.cpp`: Direct USB Audio Class driver enabling bit-perfect asynchronous audio streaming to external DACs bypassing the Android audio mixer.
  - `exclusive_pass.cpp`: AAudio exclusive mode engine for ultra-low latency, jitter-free playback.
- **Linker Flags:** `-O2 -Wall -fvisibility=hidden -Wl,-z,max-page-size=16384` (compliant with Android 15 16KB memory page sizes).

---

## 5. UI/UX & Design System Audit

The application implements an iOS-inspired design language with custom Compose building blocks:
- **Typography:** `InterFontFamily` with tight tracking (`-0.04em` title tracking, `-0.035em` subtitle tracking).
- **Color Palette:**
  - Background: `Color(0xFF1C1C1C)`
  - Card/Field Containers: `Color(0xFF2C2C2C)`
  - Pressed States: `Color(0xFF353535)`
  - Primary Action Pill: `Color(0xFF5E5E5E)`
  - Text Primary: `Color.White`
  - Text Subtitle / Muted: `Color(0xFFBDBDBD)` / `Color(0xFF8C8C8C)` / `Color(0xFF6A6A6A)`
- **Components:**
  - `OnboardingPage`: Clean header badge, bold headline, fluid content area, pinned bottom action row.
  - `OnbButton`: Tactile pill button with smooth spring dip animation (`0.97f` scale on press).
  - `OnbTextField`: Borderless pill input with `InterFontFamily` and subtle contrast.
  - `PopupSheetState`: Modal sheets with drag handles and glass blur backdrops.
  - `HomeCard`: Rounded squircle cards with subtle top highlights (`HomeCardHighlight`).

---

## 6. Existing Updater Mechanism

- **Implementation:** `com.mochyy.mochymusic.core.updater`
- **Source:** Queries GitHub API (`https://api.github.com/repos/techxsarwar/Melo/releases`).
- **Channels:** `Release`, `Beta`, `Nightly`.
- **UI:** `UpdateSheet.kt`, `UpdatePromptSheet.kt`, `VersionRing.kt`.
- **Upgrade Path:** We will seamlessly extend this updater to check the self-hosted Melo Go backend API (`/api/v1/releases/latest`) with fallback to GitHub releases, ensuring users receive OTA updates directly from our Cloudflare R2 distribution pipeline.

---

## 7. Audit Conclusion

The repository is clean, modern, and perfectly suited as the primary codebase. Its modular architecture allows non-invasive extension:
1. Firebase Authentication can be added cleanly into `com.mochyy.mochymusic.ui.screens.auth` using the exact `Onb` design tokens.
2. Cloud library sync will run non-invasively against the Room database (`MochyDatabase`).
3. Push notifications (FCM) can be registered without impacting the FOSS variant.
