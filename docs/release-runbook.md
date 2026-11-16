# Melo V2 — Application Release Runbook

## 1. Prerequisites

Before producing a production release of Melo V2:
- Ensure all automated unit and integration tests pass:
  ```bash
  .\gradlew testUniversalDebugUnitTest
  cd backend && go test -v ./...
  cd ../admin && npm run build
  ```
- Verify that no debug endpoints, mock tokens, or uncommitted secrets exist in the tree.
- Ensure the Android application ID is `com.music.melo`.

---

## 2. Release Steps

### Step 1: Bump Application Version
In `app/build.gradle.kts`, increment `versionCode` and update `versionName`:
```kotlin
defaultConfig {
    applicationId = "com.music.melo"
    versionCode = 103      // Must be strictly greater than previous release
    versionName = "2.0.1"
    ...
}
```

### Step 2: Assemble Release Binary
Generate the signed release APK:
```bash
.\gradlew assembleUniversalRelease
```
*(For development/testing builds, `.\gradlew assembleUniversalDebug` can be used.)*

The compiled APK will be located at:
`app/build/outputs/apk/universal/release/app-universal-release.apk`

### Step 3: Compute Binary SHA-256 Checksum
Compute the exact SHA-256 checksum of the APK file. This checksum is validated byte-for-byte by the client before installation:

**Windows PowerShell:**
```powershell
Get-FileHash -Algorithm SHA256 app\build\outputs\apk\universal\release\app-universal-release.apk
```

**Linux / macOS:**
```bash
sha256sum app/build/outputs/apk/universal/release/app-universal-release.apk
```

### Step 4: Upload Artifact to Cloudflare R2
Upload the release APK to the R2 release directory (or GitHub Releases mirror):
```bash
# S3 CLI or Presigned Upload to melo-images/releases/melo-2.0.1.apk
```

### Step 5: Register Release in Admin Console / Go API
Using the Next.js Admin Console (`/releases`) or Go API endpoint `POST /v1/admin/releases`, publish the release payload:

```json
{
  "platform": "android",
  "channel": "stable",
  "version_code": 103,
  "version_name": "2.0.1",
  "min_supported_version_code": 100,
  "package_name": "com.music.melo",
  "download_url": "https://pub-65f5c567634e486682c0d063bc40dd16.r2.dev/releases/melo-2.0.1.apk",
  "sha256": "YOUR_COMPUTED_SHA256_HEX_STRING",
  "signing_cert_sha256": "YOUR_SIGNING_CERT_SHA256",
  "file_size_bytes": 53185540,
  "release_notes": "• Cloud Library Sync enhancements\n• Community playlist sharing\n• Performance and playback fixes",
  "rollout_percentage": 100,
  "status": "published",
  "mandatory": false
}
```

---

## 3. Client Verification Safety Rules

The Android client (`MeloUpdater.kt`) enforces the following security checks:
1. **Integer Version Comparison:** The incoming `version_code` must be strictly greater than `BuildConfig.VERSION_CODE`.
2. **Package ID Matching:** The incoming `package_name` must match the running application package (`com.music.melo`).
3. **SHA-256 Integrity Verification:** The downloaded APK bytes are streamed through `java.security.MessageDigest("SHA-256")`. If the computed hash does not match `release.sha256` case-insensitively, the file is immediately discarded and the update aborted.

---

## 4. Rollback & Emergency Procedures

If a published release exhibits critical issues in the field:
1. Navigate to **App Releases** in the Admin Console.
2. Select the problematic release and toggle status to `withdrawn` or `paused`.
3. The Go backend `/v1/app/update` endpoint will immediately stop serving the update to clients.
4. Prepare and publish a hotfix release with an incremented `version_code` (e.g. `104`).
