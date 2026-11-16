# Android Feature Inventory — Melo Client

**Document Version:** 1.0.0  
**Inspection Date:** 2026-11-16  
**Namespace:** `com.mochyy.mochymusic`  
**Application ID:** `com.melo.music`  
**Phase:** Phase 1 Deliverable  

---

## 1. Feature Map & Modules

### 1.1 Audio Engine & Playback
- **Bit-Perfect USB Pass-Through (`mochypass`):** Native C++ driver supporting USB audio class DACs directly, bypassing Android AudioFlinger resampling.
- **AAudio Exclusive Mode:** Ultra-low latency audio output using Android's native AAudio pipeline.
- **Equalizer & Audio Effects:** Graphic equalizer, bass boost, virtualizer, reverb, and AutoEq profile integration.
- **Crossmix & Seamless Transitions:** Smooth gapless playback, crossfade curves, and tempo/pitch adjustment.
- **Background & Lockscreen Playback:** Android Media3 MediaSessionService with full notification and transport controls.

### 1.2 Content & Search
- **YouTube InnerTube Integration:** High-speed streaming, artist discography, albums, playlists, and related tracks.
- **Search Experience:** Real-time search with interactive filters (Songs, Albums, Artists, Playlists), query suggestions, and history.
- **Synced Lyrics:** Real-time synced syllable lyrics via LRCLIB and LyricsPlus providers, customizable typography, and translation.
- **Canvas Video Backgrounds:** Short looping background visuals for supported tracks.
- **Radio & Queue Generation:** Dynamic queue management, endless radio mode, and shuffle algorithms.

### 1.3 Library & Offline Management
- **Room Database (`MochyDatabase`):** Local caching of favorites, custom playlists, recent plays, downloaded media, and listen statistics.
- **Offline Downloads:** High-quality audio download manager with metadata embedding, offline playlist caching, and storage management.
- **Scrobbling:** Integration with Last.fm, ListenBrainz, and Libre.fm scrobblers.

### 1.4 UI & Interaction Design
- **iOS-Inspired Design System:** Tactile pill buttons (`OnbButton`), clean header badges (`PageBadge`), dark charcoal surfaces (`Color(0xFF1C1C1C)`), and Inter typography.
- **Glassmorphism:** Live dynamic blur overlays (`GlassState`) behind navigation bars and headers.
- **Interactive Gestures:** Swipe-to-dismiss, sheet morphing, and interactive playback sheet gestures.
- **Theming:** True dark mode, pure black OLED mode, and subtle ambient highlights.

### 1.5 Updates & Telemetry
- **OTA Updater:** In-app release checks (`mochyupdater`), download manager, APK signature validation, and channel selection (Release / Beta / Nightly).
- **Diagnostics:** Integrated playback diagnostics, stream health monitors, and cipher debugging tools.

---

## 2. Invariants & Preservation Contract
1. **Zero Music Feature Regressions:** Under no circumstances will any audio engine, streaming, or caching code be modified or removed.
2. **Design Cohesion:** All new features (Firebase Authentication, Cloud Sync, Remote Config) must strictly follow the `Onb` design patterns established in `OnboardingDesign.kt`.
3. **Guest Mode Fallback:** Authentication is strictly optional for local and streaming playback; users may continue as Guests without account friction.
