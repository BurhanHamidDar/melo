# Melo V2 — Redacted Credentials & Infrastructure Inventory

**Generated:** 16 November 2026  
**Document Classification:** Redacted Configuration Inventory  
**Security Policy:** Variable names, locations, and verification statuses only. Strictly NO secret values, tokens, or keys.

---

## 1. Cloudflare R2 Object Storage

| Configuration Key | Location | Status | Purpose |
|---|---|---|---|
| `R2_ACCOUNT_ID` | `backend/.env` | PRESENT | Cloudflare account identifier |
| `R2_ACCESS_KEY_ID` | `backend/.env` | PRESENT | S3-compatible API token access key ID |
| `R2_SECRET_ACCESS_KEY` | `backend/.env` | PRESENT | S3-compatible API token secret |
| `R2_IMAGES_BUCKET` | `backend/.env` | PRESENT | Target bucket (`melo-images`) |
| `R2_ENDPOINT` | `backend/.env` | PRESENT | Account-specific S3 API endpoint URL |
| `R2_PUBLIC_IMAGE_BASE_URL` | `backend/.env` | PRESENT | Public CDN distribution domain |

---

## 2. Neon Serverless PostgreSQL Database

| Configuration Key | Location | Status | Purpose |
|---|---|---|---|
| `DATABASE_URL` | `backend/.env` | PRESENT | Neon pooled PgBouncer connection string |
| `DATABASE_DIRECT_URL` | Documented / Environment | PRESENT | Neon direct migration connection string |
| Neon Host | Both connection strings | PRESENT | `ep-fragrant-forest-ao5ittzg` |
| Tables Status | Neon PostgreSQL | VERIFIED | 18 relational tables active |

---

## 3. Firebase Project & Authentication

| Configuration Key | Location | Status | Purpose |
|---|---|---|---|
| `FIREBASE_PROJECT_ID` | `backend/.env`, `admin/.env.local` | PRESENT | Project identifier (`melo-v2`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | `backend/firebase-service-account.json` | PRESENT | Service account private key for Admin SDK |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `admin/.env.local` | PRESENT | Firebase Web API client key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `admin/.env.local` | PRESENT | Auth domain (`melo-v2.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `admin/.env.local` | PRESENT | Cloud storage bucket reference |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `admin/.env.local` | PRESENT | FCM messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `admin/.env.local` | PRESENT | Web application client ID |
| Android Client Configuration | `app/google-services.json` | PRESENT | Multi-client config (`com.music.melo`, `com.music.melo.debug`) |

---

## 4. Backend & Web Admin Platform

| Configuration Key | Location | Status | Purpose |
|---|---|---|---|
| `APP_ENV` | `backend/.env` | PRESENT | Environment mode (`development` / `production`) |
| `PORT` | `backend/.env` | PRESENT | Listening port (`8080`) |
| `ALLOWED_ADMIN_ORIGINS` | `backend/.env` | PRESENT | CORS allowlist for Admin Dashboard |
| `NEXT_PUBLIC_API_URL` | `admin/.env.local` | PRESENT | Backend API base URL for Admin Console |

---

## 5. Android Keystore & Application Identity

| Item | Location / Config | Status | Purpose |
|---|---|---|---|
| Debug Keystore | `~/.android/debug.keystore` | VERIFIED | Local build signing |
| Debug Fingerprint (SHA-1) | Documented | VERIFIED | `29:BA:0D:37:37:37:04:88:EC:92:B2:D6:78:E5:A9:A0:09:A6:4E:99` |
| Debug Fingerprint (SHA-256) | Documented | VERIFIED | `FF:17:F1:C9:46:11:D3:58:62:C0:B6:81:42:07:95:5F:80:C9:A2:81:04:C4:F3:13:92:E4:F7:55:67:3B:AA:05` |
| Production Keystore | External Secure Storage | UNCOMMITTED | Production release signing (kept off Git) |
