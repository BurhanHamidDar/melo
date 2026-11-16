# Melo V2 — REST API Specification (`/v1`)

## 1. General Conventions

- **Base URL:** `http://localhost:8080/v1` (local development) / `https://api.melo.app/v1` (production)
- **Content-Type:** `application/json; charset=utf-8` (all endpoints except binary transfers)
- **Time Representation:** ISO-8601 UTC timestamps (e.g., `2026-11-15T22:30:00Z`)
- **Resource Identifiers:** UUIDv4 strings (e.g., `3fa85f64-5717-4562-b3fc-2c963f66afa6`)
- **Authentication:** `Authorization: Bearer <Firebase_ID_Token>` on all protected routes

### Standard Error Envelope:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Detailed explanation of validation or server error",
    "request_id": "req-12345",
    "details": {}
  }
}
```

---

## 2. API Endpoints Catalog

### 2.1 System & Health
- `GET /v1/health` — Service liveness probe (returns status 200).
- `GET /v1/ready` — Service readiness probe verifying Neon DB connectivity.

### 2.2 User Profile & Devices
- `GET /v1/me` — Retrieve current authenticated user profile.
- `PATCH /v1/me` — Update display name, bio, profile visibility.
- `POST /v1/me/username/check` — Check availability of desired username.
- `POST /v1/me/devices` — Register FCM device token and install ID.
- `DELETE /v1/me/devices/{install_id}` — De-register device on logout.
- `POST /v1/me/account-deletion` — Request account and data deletion.
- `GET /v1/me/export` — Export user-owned metadata (GDPR compliant).

### 2.3 Cloud Sync
- `POST /v1/sync/push` — Idempotently push local Room DB mutations (liked songs, playlists).
- `GET /v1/sync/pull?cursor={cursor}` — Pull remote mutations sequentially.

### 2.4 Asset Storage (Cloudflare R2)
- `POST /v1/uploads/presign` — Generate short-lived (5 min) authenticated S3 PUT URL for avatars or covers.
- `POST /v1/uploads/complete` — Verify asset upload and register in database.

### 2.5 App Releases & Announcements
- `GET /v1/app/update?platform=android&channel=stable&version_code=102` — Query latest app release with SHA-256 verification checksum.
- `GET /v1/announcements?channel=stable` — List active broadcasts and banner announcements.

### 2.6 Playlists & Collaboration
- `POST /v1/playlists` — Create a new playlist.
- `GET /v1/playlists/{id}` — Get playlist details and tracks (enforces visibility/member rules).
- `PATCH /v1/playlists/{id}` — Update title, description, visibility, or collaborative flag.
- `DELETE /v1/playlists/{id}` — Soft delete playlist (owner only).
- `POST /v1/playlists/{id}/tracks` — Add track to playlist with monotonic position key.
- `DELETE /v1/playlists/{id}/tracks/{trackId}` — Remove track from playlist.
- `PUT /v1/playlists/{id}/tracks/order` — Reorder playlist tracks atomically.
- `POST /v1/playlists/{id}/follow` — Follow a public/unlisted playlist.
- `DELETE /v1/playlists/{id}/follow` — Unfollow playlist.
- `GET /v1/playlists/{id}/members` — List collaborators and roles.
- `POST /v1/playlists/{id}/members` — Add collaborator (`editor` or `viewer`).
- `PATCH /v1/playlists/{id}/members/{userId}` — Update collaborator role.
- `DELETE /v1/playlists/{id}/members/{userId}` — Remove collaborator.

### 2.7 Community & Moderation
- `GET /v1/community/playlists` — Browse approved public community playlists.
- `GET /v1/community/profiles/{username}` — Fetch public community profile.
- `POST /v1/community/reports` — Submit moderation report for playlist, profile, or announcement.

### 2.8 Administrative Console (RBAC Protected)
- `GET /v1/admin/overview` — Dashboard summary metrics.
- `GET /v1/admin/users` — Search and inspect user accounts.
- `PATCH /v1/admin/users/{id}/status` — Suspend, restore, or ban a user.
- `GET /v1/admin/reports` — Review moderation queue.
- `PATCH /v1/admin/reports/{id}` — Review, resolve, or dismiss report.
- `POST /v1/admin/announcements` — Publish system-wide announcements.
- `POST /v1/admin/releases` — Publish new APK release with SHA-256 validation.
- `GET /v1/admin/audit-logs` — Immutable administrative audit trail.
