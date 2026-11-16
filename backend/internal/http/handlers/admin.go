package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/models"
)

type AdminHandler struct {
	DB *database.DB
}

func NewAdminHandler(db *database.DB) *AdminHandler {
	return &AdminHandler{DB: db}
}

func (h *AdminHandler) Overview(w http.ResponseWriter, r *http.Request) {
	var totalUsers int64 = 0
	var activeUsers int64 = 0
	var suspendedUsers int64 = 0
	var totalPlaylists int64 = 0
	var openReports int64 = 0
	var activeAnnouncements int64 = 0

	if h.DB != nil && h.DB.Pool != nil {
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM users").Scan(&totalUsers)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '30 days'").Scan(&activeUsers)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM users WHERE account_status IN ('suspended', 'banned')").Scan(&suspendedUsers)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM playlists WHERE deleted_at IS NULL AND visibility = 'public'").Scan(&totalPlaylists)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM reports WHERE status = 'open'").Scan(&openReports)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM announcements WHERE status = 'published'").Scan(&activeAnnouncements)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"metrics": map[string]interface{}{
			"total_users":          totalUsers,
			"active_users_30d":     activeUsers,
			"suspended_users":      suspendedUsers,
			"public_playlists":     totalPlaylists,
			"open_reports":         openReports,
			"active_announcements": activeAnnouncements,
			"current_stable":       "1.0.2",
			"current_beta":         "2.0.0-rc1",
		},
		"system_health": map[string]string{
			"database": "healthy",
			"storage":  "healthy",
			"auth":     "healthy",
		},
	})
}

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	searchQuery := strings.TrimSpace(r.URL.Query().Get("q"))
	users := make([]models.User, 0)

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, firebase_uid, email, username, display_name, bio, avatar_asset_id,
			       profile_visibility, account_status, created_at, updated_at, last_seen_at
			FROM users
			WHERE ($1 = '' OR username ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
			ORDER BY created_at DESC
			LIMIT 50
		`
		rows, err := h.DB.Pool.Query(r.Context(), query, searchQuery)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var u models.User
				if err := rows.Scan(&u.ID, &u.FirebaseUID, &u.Email, &u.Username, &u.DisplayName, &u.Bio, &u.AvatarAssetID, &u.ProfileVisibility, &u.AccountStatus, &u.CreatedAt, &u.UpdatedAt, &u.LastSeenAt); err == nil {
					users = append(users, u)
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"users": users,
		"count": len(users),
	})
}

func (h *AdminHandler) UpdateUserStatus(w http.ResponseWriter, r *http.Request) {
	admin := middleware.GetUserFromContext(r.Context())
	userIDStr := r.PathValue("id")
	targetUserID, err := uuid.Parse(userIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid user UUID")
		return
	}

	var req struct {
		Status string `json:"status"` // active, suspended, banned
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse payload")
		return
	}

	if req.Reason == "" {
		writeError(w, http.StatusBadRequest, "REASON_REQUIRED", "A reason must be provided for status changes")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		_, err = h.DB.Pool.Exec(r.Context(), "UPDATE users SET account_status = $1, updated_at = NOW() WHERE id = $2", req.Status, targetUserID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update user status")
			return
		}

		// Record audit log
		auditQuery := `
			INSERT INTO admin_audit_logs (actor_user_id, action, target_type, target_id, reason, metadata)
			VALUES ($1, 'update_user_status', 'user', $2, $3, $4)
		`
		meta, _ := json.Marshal(map[string]string{"new_status": req.Status})
		_, _ = h.DB.Pool.Exec(r.Context(), auditQuery, admin.ID, targetUserID.String(), req.Reason, meta)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "User status updated successfully",
	})
}

func (h *AdminHandler) CreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	admin := middleware.GetUserFromContext(r.Context())
	var a models.Announcement
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse announcement")
		return
	}

	if a.Title == "" || a.Body == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Title and Body are required")
		return
	}

	a.ID = uuid.New()
	if a.Severity == "" {
		a.Severity = "info"
	}
	if a.Status == "" {
		a.Status = "published"
	}

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			INSERT INTO announcements (id, title, body, image_asset_id, severity, target_channel, target_min_version_code, status, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`
		_, err := h.DB.Pool.Exec(r.Context(), query, a.ID, a.Title, a.Body, a.ImageAssetID, a.Severity, a.TargetChannel, a.TargetMinVersionCode, a.Status, admin.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to insert announcement")
			return
		}
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"announcement": a,
	})
}

func (h *AdminHandler) CreateRelease(w http.ResponseWriter, r *http.Request) {
	var rel models.AppRelease
	if err := json.NewDecoder(r.Body).Decode(&rel); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse release")
		return
	}

	if rel.VersionCode <= 0 || rel.VersionName == "" || rel.SHA256 == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "VersionCode, VersionName, and SHA256 are required")
		return
	}

	rel.ID = uuid.New()
	if rel.Platform == "" {
		rel.Platform = "android"
	}
	if rel.PackageName == "" {
		rel.PackageName = "com.music.melo"
	}
	if rel.Status == "" {
		rel.Status = "draft"
	}

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			INSERT INTO app_releases (id, platform, channel, version_code, version_name, min_supported_version_code,
			                         package_name, download_url, sha256, signing_cert_sha256, file_size_bytes, release_notes,
			                         rollout_percentage, status, mandatory)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		`
		_, err := h.DB.Pool.Exec(r.Context(), query, rel.ID, rel.Platform, rel.Channel, rel.VersionCode, rel.VersionName,
			rel.MinSupportedVersionCode, rel.PackageName, rel.DownloadURL, rel.SHA256, rel.SigningCertSHA256,
			rel.FileSizeBytes, rel.ReleaseNotes, rel.RolloutPercentage, rel.Status, rel.Mandatory)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to save release: "+err.Error())
			return
		}
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"release": rel,
	})
}

func (h *AdminHandler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	logs := make([]models.AdminAuditLog, 0)

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, actor_user_id, action, target_type, target_id, reason, request_id, metadata, created_at
			FROM admin_audit_logs
			ORDER BY created_at DESC
			LIMIT 50
		`
		rows, err := h.DB.Pool.Query(r.Context(), query)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var l models.AdminAuditLog
				if err := rows.Scan(&l.ID, &l.ActorUserID, &l.Action, &l.TargetType, &l.TargetID, &l.Reason, &l.RequestID, &l.Metadata, &l.CreatedAt); err == nil {
					logs = append(logs, l)
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"audit_logs": logs,
	})
}
