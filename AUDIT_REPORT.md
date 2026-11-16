# Melo V2 — Phase 0 Codebase Audit Report

**Date:** 15 November 2026  
**Auditor:** Lead Systems & Android Engineer (Antigravity)  
**Target Repository:** `https://github.com/techxsarwar/melo.git`  
**Inspected Commit:** `a0d5c375d54a549ea112e9423655ef331a42cbe0`  
**Inspected Branch:** `main` (tracking `origin/main`)  
**Status:** Phase 0 Baseline Audit Completed  

---

## 1. Executive Summary

This audit establishes the baseline for evolving the existing Melo Android application into **Melo V2**.
The codebase was cloned, verified, compiled, tested, and inspected across all architectural layers.

### Key Baseline Metrics
- **Application ID:** `com.sarwar.melo` (debug suffix `.debug`)
- **Version Code:** `12`
- **Version Name:** `1.0.2-Mnova`
- **SDK Targets:** `minSdk = 26`, `targetSdk = 35`, `compileSdk = 36`
- **Build Status:** `assembleUniversalDebug` completed successfully (`BUILD SUCCESSFUL in 5m 2s`).
- **Generated Baseline Artifact:** `app/build/outputs/apk/universal/debug/app-universal-debug.apk` (51,389,458 bytes).
- **Unit Test Results:** 19 tests executed; 18 passed, 1 failed (`TogetherGuestPlaybackPlannerTest.planPlayTrackNow_addsAndSkips_whenTrackMissingAndAddAllowed` due to opcode mismatch in `TogetherGuestPlaybackPlanner.kt:40`).

---

## 2. Repository & Module Architecture

### 2.1 Multi-Module Layout
```text
Melo-v2/
├── app/                  # Main Android application (Compose UI, Media3 playback service, Room DB, Hilt DI)
├── innertube/            # YouTube Music InnerTube API client (models, extractors, PoToken)
├── betterlyrics/         # BetterLyrics provider integration (synced/syllable lyrics)
├── canvas/               # Spotify Canvas artwork / short video integration
├── kizzy/                # Discord Rich Presence (RPC) client
├── kugou/                # KuGou lyrics client (fallback provider)
├── lastfm/               # Last.fm scrobbler and metadata client
├── lrclib/               # LRCLIB synchronized lyrics client
├── simpmusic/            # SimpMusic provider and stream resolver integration
├── gradle/               # Gradle wrapper (9.4.1) and version catalog (libs.versions.toml)
├── MELO_V2_MASTER_PRD.md # Master Product Requirements Document
├── local.properties      # Local SDK and build configuration (Android SDK, API keys)
└── gradle.properties     # JVM arguments and build flags
```

### 2.2 Build Environment
- **Gradle:** 9.4.1
- **Android Gradle Plugin (AGP):** 9.1.1
- **Kotlin:** 2.3.10
- **KSP:** 2.3.6
- **JVM Toolchain:** OpenJDK 21 (Temurin-21.0.13+9 installed and verified)
- **Go Version:** go1.23.4 windows/amd64
- **Node.js:** v24.22.3, npm 11.5.2

---

## 3. Existing Feature Inventory & Implementation Matrix

| Feature | Code Path / Module | Implementation Status | Runtime / Build Verification | Notes & Recommendations |
|---|---|---|---|---|
| **Audio Playback Engine** | `app/.../playback/MusicService.kt`, Media3 ExoPlayer | **Working** | Verified in build & compile | Media3 1.9.2, background playback, audio focus, notification controls, sleep timer, playback pitch/speed. |
| **Local Room Database** | `app/.../db/MusicDatabase.kt` (v28) | **Working** | Verified in compile | Version 28 schema with automated and universal migration mechanism. |
| **YouTube Music Search & Discovery** | `innertube/`, `app/.../ui/screens/search/` | **Working** | Verified in compile | InnerTube API client with parser for albums, artists, tracks, playlists, and search suggestions. |
| **Synced Lyrics Engine** | `lrclib/`, `betterlyrics/`, `kugou/`, `app/.../lyrics/` | **Working** | Verified in compile | Multi-provider fallback chain (LRCLib -> BetterLyrics -> KuGou). |
| **Spotify Canvas Artwork** | `canvas/` | **Working** | Verified in compile | Dynamic background canvas support. |
| **Discord Rich Presence** | `kizzy/`, `app/.../ui/screens/settings/DiscordPresenceManager.kt` | **Working** | Verified in compile | Optional Discord RPC activity sharing. |
| **Last.fm Scrobbling** | `lastfm/`, `app/.../ui/screens/settings/LastFMSettings.kt` | **Working** | Verified in compile | Scrobbler with API credentials in BuildConfig. |
| **Together / Sync Listening** | `app/.../together/` | **Partial / Defect** | 1 unit test failed | Unit test `TogetherGuestPlaybackPlannerTest` failed due to `SeekToTrack` opcode output instead of `SkipNext`. |
| **App Updater** | `app/.../utils/Updater.kt`, `UpdateScreen.kt` | **Partial / Insecure** | Verified in compile | Relies directly on GitHub releases without SHA-256 or signing certificate verification. |
| **In-App Developer/Admin Panel** | `app/.../ui/screens/settings/AdminPanelScreen.kt` | **Insecure / Legacy** | Needs removal / replacement | Embeds Supabase client-side queries directly in Android app. Must be replaced by the standalone Go backend + Next.js web dashboard. |
| **User Accounts / Cloud Sync** | None (Local only) | **Not Present** | N/A | To be implemented in Phase 1-3 using Firebase Auth + Go API + Neon PostgreSQL. |
| **Cloudflare R2 Image Storage** | None | **Not Present** | N/A | To be implemented in Phase 4. |
| **FCM Push Notifications** | None | **Not Present** | N/A | To be implemented in Phase 4-5. |
| **Admin Web Dashboard** | None | **Not Present** | N/A | To be built in Phase 5 with Next.js + TypeScript. |

---

## 4. Room Database Schema & Persistence Baseline

The local database (`song.db`) is currently on **version 28** (`InternalDatabase`).
Entities:
- `song` (`SongEntity`): ID, title, duration, thumbnailUrl, albumId, albumName, liked, totalPlayTime, downloadState, inLibrary, explicit.
- `artist` (`ArtistEntity`): ID, name, thumbnailUrl, lastUpdateTime.
- `album` (`AlbumEntity`): ID, title, year, thumbnailUrl, songCount, duration, lastUpdateTime, bookmarkedAt.
- `playlist` (`PlaylistEntity`): ID, name, browseId, createdAt, lastUpdateTime, bookmarkedAt, isEditable.
- `song_artist_map` (`SongArtistMap`): mapping between songs and artists with positional ordering.
- `song_album_map` (`SongAlbumMap`): mapping between songs and albums with track indices.
- `album_artist_map` (`AlbumArtistMap`): mapping between albums and artists.
- `playlist_song_map` (`PlaylistSongMap`): songs in playlists with positional indices.
- `search_history` (`SearchHistory`): query strings with unique index.
- `format` (`FormatEntity`): audio format metadata, bitrate, itag, mimeType, content length.
- `lyrics` (`LyricsEntity`): plain and synced lyric text.
- `event` (`Event`): play history records with timestamps and durations.
- `related_song_map` (`RelatedSongMap`): recommendations map.
- `set_video_id` (`SetVideoIdEntity`): video mapping.
- `play_count` (`PlayCountEntity`): track play frequency counters.
- `tag` (`TagEntity`) & `playlist_tag_map` (`PlaylistTagMap`): playlist tags.
- `song_skip` (`SongSkipEntity`): skip count trackers.

**Migration Strategy for V2:**
- All local user data (songs, liked tracks, playlists, play history) will remain intact.
- Room migrations will safely add cloud sync cursors and sync status columns without dropping existing tables.

---

## 5. Security, Privacy & Compliance Findings

1. **Client-Side Supabase Exposure (Critical Security Finding):**
   - The current Android source contains direct dependencies on `io.github.jan-tennert.supabase:postgrest-kt`.
   - `AdminPanelScreen.kt` allows entering Supabase credentials and directly performs queries on `active_sessions`, `app_updates`, and `broadcast_notifications`.
   - *Remediation:* Completely isolate and replace this with the secure Go REST API and standalone Next.js admin dashboard.
2. **Third-Party Provider Compliance & Stream Isolation:**
   - InnerTube and SimpMusic streams are resolved directly on-device. Audio streams must NEVER be routed through the Go backend or stored in Neon/R2.
   - Preserves YouTube terms by not operating as a stream proxy or caching copyrighted audio on servers.
3. **App Update Safety:**
   - Current updater directly triggers downloads from GitHub without verifying SHA-256 hashes or signing certificates before handoff to package installer.
   - *Remediation:* Implement `/v1/app/update` API in Go, validating SHA-256 and expected signing certificate before handing APK to Android's `PackageInstaller`.
4. **License Compliance:**
   - Melo is licensed under **GPL-3.0**. All notices, headers, and upstream author credits (`Sarwar Altaf Dar`, `techxsarwar`, `ParallelogramFoundation`) must be strictly preserved.

---

## 6. Baseline Verification Commands & Results

```powershell
# Git Inspection
git rev-parse HEAD
# Output: a0d5c375d54a549ea112e9423655ef331a42cbe0

# Baseline Unit Tests
$env:JAVA_HOME="$env:USERPROFILE\.jdks\jdk-21.0.13+9"
.\gradlew.bat testUniversalDebugUnitTest
# Result: 19 tests completed, 1 failed (TogetherGuestPlaybackPlannerTest)

# Baseline APK Assembly
$env:JAVA_HOME="$env:USERPROFILE\.jdks\jdk-21.0.13+9"
.\gradlew.bat assembleUniversalDebug
# Result: BUILD SUCCESSFUL in 5m 2s
# Artifact: app/build/outputs/apk/universal/debug/app-universal-debug.apk (51,389,458 bytes)
```
