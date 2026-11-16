# Melo V2 — Phase 0: Workspace, Credential & Resource Inventory

**Date:** 16 November 2026  
**Auditor:** Antigravity Engineering Lead  
**Specification Reference:** `new/MELO_REPLACEMENT_AND_ADMIN_PLATFORM_MASTER_PRD.md`  
**Phase Status:** COMPLETED (Exit Gate Satisfied)

---

## 1. Workspace & Git Repository State

- **Active Workspace Directory:** `C:\Users\Burhan\Downloads\Melo-v2`
- **Git Remote (`origin`):** `https://github.com/techxsarwar/melo.git`
- **Current Local Commit:** `a0d5c37` (`feat: rename app to Mnova, add snogdox to developers, and update build artifact`)
- **Upstream Remote Commit (HEAD):** `21e45746bf6f8f5c56a986102e0ba9726ab2490d`
- **Active Branch:** `main`
- **Application Modules Identified:**
  - Android Root & Subprojects: `app/`, `innertube/`, `kizzy/`, `kugou/`, `lastfm/`, `lrclib/`, `betterlyrics/`, `canvas/`, `simpmusic/`
  - Backend Service: `backend/` (Go 1.25 REST API, `pgxpool`, AWS S3 SDK for R2)
  - Admin Web Application: `admin/` (Next.js 15.5.29, Tailwind CSS, Firebase Web SDK)
  - Database Migrations: `backend/migrations/` (`00001_initial_schema.sql`, `00002_update_package_name.sql`)
  - Documentation Suite: `docs/` (`architecture.md`, `database.md`, `api.md`, `deployment.md`, `release-runbook.md`, `openapi.yaml`)

---

## 2. Infrastructure & Cloud Configuration Audit

All required external cloud services are already provisioned and confirmed active:

1. **Neon PostgreSQL Database:**
   - **Host:** `ep-fragrant-forest-ao5ittzg` (AWS ap-southeast-1)
   - **Tables Verified (18):** `admin_audit_logs`, `admin_roles`, `announcements`, `app_releases`, `feature_flags`, `listening_history`, `media_assets`, `playlist_follows`, `playlist_members`, `playlist_tracks`, `playlists`, `reports`, `schema_migrations`, `sync_mutations`, `user_devices`, `user_library_items`, `user_settings`, `users`.
   - **Connection Mode:** Pooled connection string for API runtime; direct connection string for schema migrations.

2. **Cloudflare R2 Object Storage:**
   - **Account ID:** Present in `backend/.env`
   - **Bucket:** `melo-images`
   - **Public Distribution URL:** `https://pub-65f5c567634e486682c0d063bc40dd16.r2.dev`
   - **Upload Integration:** Verified via presigned S3 PUT URL generation and retrieval test (`PASS`).

3. **Firebase Platform (Authentication & Messaging):**
   - **Project ID:** `melo-v2`
   - **Web Client:** Initialized in `admin/.env.local`
   - **Admin Service Account:** Verified in `backend/firebase-service-account.json`
   - **Android Client:** Configured in `app/google-services.json` for `com.music.melo` and `com.music.melo.debug`.

4. **Redacted Credentials Inventory:**
   - Documented in [`docs/credentials-inventory.redacted.md`](file:///C:/Users/Burhan/Downloads/Melo-v2/docs/credentials-inventory.redacted.md).

---

## 3. Timestamped Workspace Backup

Before undertaking any destructive changes or replacing the Android source, an isolated, complete backup of the entire working workspace was generated outside the project root:

- **Backup Directory Path:** `C:\Users\Burhan\Downloads\melo-v2-backup-20261116-phase0`
- **Excluded Ephemeral Artifacts:** `.gradle`, `.kotlin`, `build`, `.next`, `node_modules`
- **Included Content:**
  - Complete Android codebase across all subprojects
  - Go API backend (`backend/`) and versioned SQL migrations
  - Next.js administration console (`admin/`)
  - All local configuration and secret files (`backend/.env`, `admin/.env.local`, `app/google-services.json`, `backend/firebase-service-account.json`)
  - Complete documentation and planning files
- **Verification Result:** Readability confirmed for all key files and secret stores.

---

## 4. Phase 0 Exit Gate Verification

- [x] Old workspace audited and Git state documented.
- [x] Existing Firebase, Neon, and Cloudflare credentials identified and verified without printing secret values.
- [x] Full timestamped backup created outside the active directory and verified.
- [x] Redacted credentials inventory produced in `docs/credentials-inventory.redacted.md`.
- [x] Zero cloud resources or database contents deleted or altered.
- [x] Old Android source remains in place in the active workspace pending Phase 1 verification.

**Conclusion:** Phase 0 is complete. The workspace is ready for Phase 1 (cloning the latest `techxsarwar/melo` repository into a clean temporary directory, auditing its changes, and running an untouched baseline build).
