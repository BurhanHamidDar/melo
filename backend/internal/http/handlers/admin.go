package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/models"
	"github.com/melo-v2/backend/internal/notifications"
)

type AdminHandler struct {
	DB  *database.DB
	FCM *notifications.FCMService
}

func NewAdminHandler(db *database.DB, fcm *notifications.FCMService) *AdminHandler {
	return &AdminHandler{DB: db, FCM: fcm}
}

type ActivityDataPoint struct {
	Date      string `json:"date"`
	DayName   string `json:"day_name"`
	Mutations int64  `json:"mutations"`
	Signups   int64  `json:"signups"`
	TotalOps  int64  `json:"total_ops"`
}

func (h *AdminHandler) Overview(w http.ResponseWriter, r *http.Request) {
	var totalUsers int64 = 0
	var activeUsers int64 = 0
	var suspendedUsers int64 = 0
	var totalPlaylists int64 = 0
	var openReports int64 = 0
	var activeAnnouncements int64 = 0
	var totalMutations int64 = 0
	var currentStable = "2.0.0"
	var currentBeta = "2.0.0-rc1"
	var dbLatencyMs int64 = 0

	rangeParam := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("range")))
	var intervalStr string
	switch rangeParam {
	case "30d":
		intervalStr = "29 days"
	case "90d":
		intervalStr = "89 days"
	default:
		rangeParam = "7d"
		intervalStr = "6 days"
	}

	activityTrends := make([]ActivityDataPoint, 0)
	var peakDate string = ""
	var peakOps int64 = 0
	var totalPeriodOps int64 = 0

	operationsBreakdown := map[string]int64{
		"insert": 0,
		"update": 0,
		"delete": 0,
	}

	if h.DB != nil && h.DB.Pool != nil {
		start := time.Now()
		_ = h.DB.Pool.Ping(r.Context())
		dbLatencyMs = time.Since(start).Milliseconds()

		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM users").Scan(&totalUsers)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM users WHERE last_seen_at >= NOW() - INTERVAL '30 days'").Scan(&activeUsers)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM users WHERE account_status IN ('suspended', 'banned')").Scan(&suspendedUsers)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(DISTINCT entity_id) FROM sync_mutations WHERE entity_type = 'playlist'").Scan(&totalPlaylists)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM sync_mutations").Scan(&totalMutations)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM reports WHERE status = 'open'").Scan(&openReports)
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COUNT(*) FROM announcements WHERE status = 'published'").Scan(&activeAnnouncements)

		// Real latest releases from database
		var stableRelease string
		if err := h.DB.Pool.QueryRow(r.Context(), "SELECT version_name FROM app_releases WHERE channel = 'stable' AND status = 'published' ORDER BY version_code DESC LIMIT 1").Scan(&stableRelease); err == nil && stableRelease != "" {
			currentStable = stableRelease
		}
		var betaRelease string
		if err := h.DB.Pool.QueryRow(r.Context(), "SELECT version_name FROM app_releases WHERE channel = 'beta' AND status = 'published' ORDER BY version_code DESC LIMIT 1").Scan(&betaRelease); err == nil && betaRelease != "" {
			currentBeta = betaRelease
		}

		// Operations breakdown
		opRows, err := h.DB.Pool.Query(r.Context(), "SELECT operation, COUNT(*) FROM sync_mutations GROUP BY operation")
		if err == nil {
			defer opRows.Close()
			for opRows.Next() {
				var op string
				var cnt int64
				if err := opRows.Scan(&op, &cnt); err == nil {
					operationsBreakdown[op] = cnt
				}
			}
		}

		// Real time-series trend query across the requested interval
		trendQuery := fmt.Sprintf(`
			SELECT 
				TO_CHAR(d.day, 'YYYY-MM-DD') AS day_str,
				TO_CHAR(d.day, 'Dy') AS day_name,
				COALESCE(m.count, 0) AS mutations,
				COALESCE(u.count, 0) AS signups
			FROM generate_series(CURRENT_DATE - INTERVAL '%s', CURRENT_DATE, '1 day'::interval) AS d(day)
			LEFT JOIN (
				SELECT DATE(created_at) AS day, COUNT(*) AS count 
				FROM sync_mutations 
				WHERE created_at >= CURRENT_DATE - INTERVAL '%s'
				GROUP BY DATE(created_at)
			) m ON m.day = d.day::date
			LEFT JOIN (
				SELECT DATE(created_at) AS day, COUNT(*) AS count 
				FROM users 
				WHERE created_at >= CURRENT_DATE - INTERVAL '%s'
				GROUP BY DATE(created_at)
			) u ON u.day = d.day::date
			ORDER BY d.day ASC;
		`, intervalStr, intervalStr, intervalStr)

		rows, err := h.DB.Pool.Query(r.Context(), trendQuery)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var pt ActivityDataPoint
				if err := rows.Scan(&pt.Date, &pt.DayName, &pt.Mutations, &pt.Signups); err == nil {
					pt.TotalOps = pt.Mutations + pt.Signups
					totalPeriodOps += pt.TotalOps
					if pt.TotalOps > peakOps || peakDate == "" {
						peakOps = pt.TotalOps
						peakDate = pt.Date
					}
					activityTrends = append(activityTrends, pt)
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"metrics": map[string]interface{}{
			"total_users":          totalUsers,
			"active_users_30d":     activeUsers,
			"suspended_users":      suspendedUsers,
			"public_playlists":     totalPlaylists,
			"total_mutations":      totalMutations,
			"open_reports":         openReports,
			"active_announcements": activeAnnouncements,
			"current_stable":       currentStable,
			"current_beta":         currentBeta,
		},
		"analytics": map[string]interface{}{
			"range":                rangeParam,
			"activity_trends":      activityTrends,
			"peak_date":            peakDate,
			"peak_ops":             peakOps,
			"total_period_ops":     totalPeriodOps,
			"operations_breakdown": operationsBreakdown,
		},
		"system_health": map[string]interface{}{
			"database":   "healthy",
			"latency_ms": dbLatencyMs,
			"storage":    "healthy",
			"auth":       "healthy",
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

	// Dispatch push notification via FCM if available
	if h.FCM != nil {
		go func(title, body string) {
			_ = h.FCM.Send(context.Background(), notifications.PushMessage{
				Title: title,
				Body:  body,
				Topic: "announcements",
				Data: map[string]string{
					"type": "announcement",
				},
			})
		}(a.Title, a.Body)
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"announcement": a,
	})
}

func (h *AdminHandler) SendPushNotification(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title string `json:"title"`
		Body  string `json:"body"`
		Topic string `json:"topic"`
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse body")
		return
	}
	if req.Title == "" || req.Body == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Title and Body are required")
		return
	}
	if h.FCM == nil {
		writeError(w, http.StatusServiceUnavailable, "FCM_UNAVAILABLE", "Firebase Cloud Messaging service not configured")
		return
	}
	err := h.FCM.Send(r.Context(), notifications.PushMessage{
		Title: req.Title,
		Body:  req.Body,
		Topic: req.Topic,
		Token: req.Token,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "FCM_FAILED", err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Push notification dispatched successfully via FCM",
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
		// If marking this as landing primary, clear previous primary flags
		if rel.IsLandingPrimary {
			_, _ = h.DB.Pool.Exec(r.Context(), "UPDATE app_releases SET is_landing_primary = false WHERE platform = $1", rel.Platform)
		}

		query := `
			INSERT INTO app_releases (id, platform, channel, version_code, version_name, min_supported_version_code,
			                         package_name, download_url, sha256, signing_cert_sha256, file_size_bytes, release_notes,
			                         rollout_percentage, status, mandatory, scheduled_release_at, r2_object_key, is_landing_primary)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
			ON CONFLICT (platform, channel, version_code) DO UPDATE SET
				version_name = EXCLUDED.version_name,
				min_supported_version_code = EXCLUDED.min_supported_version_code,
				package_name = EXCLUDED.package_name,
				download_url = EXCLUDED.download_url,
				sha256 = EXCLUDED.sha256,
				signing_cert_sha256 = EXCLUDED.signing_cert_sha256,
				file_size_bytes = EXCLUDED.file_size_bytes,
				release_notes = EXCLUDED.release_notes,
				rollout_percentage = EXCLUDED.rollout_percentage,
				status = EXCLUDED.status,
				mandatory = EXCLUDED.mandatory,
				scheduled_release_at = EXCLUDED.scheduled_release_at,
				r2_object_key = EXCLUDED.r2_object_key,
				is_landing_primary = EXCLUDED.is_landing_primary,
				updated_at = NOW()
			RETURNING id
		`
		var savedID uuid.UUID
		err := h.DB.Pool.QueryRow(r.Context(), query, rel.ID, rel.Platform, rel.Channel, rel.VersionCode, rel.VersionName,
			rel.MinSupportedVersionCode, rel.PackageName, rel.DownloadURL, rel.SHA256, rel.SigningCertSHA256,
			rel.FileSizeBytes, rel.ReleaseNotes, rel.RolloutPercentage, rel.Status, rel.Mandatory,
			rel.ScheduledReleaseAt, rel.R2ObjectKey, rel.IsLandingPrimary).Scan(&savedID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to save release: "+err.Error())
			return
		}
		rel.ID = savedID

		var actorID *uuid.UUID
		if adminUser := middleware.GetUserFromContext(r.Context()); adminUser != nil {
			actorID = &adminUser.ID
		}
		h.recordAuditLog(r.Context(), actorID, "create_release", "app_releases", rel.ID.String(),
			fmt.Sprintf("Saved/updated release %s (v%d)", rel.VersionName, rel.VersionCode), nil)
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"release": rel,
	})
}

func (h *AdminHandler) ListReleases(w http.ResponseWriter, r *http.Request) {
	releases := make([]models.AppRelease, 0)
	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, platform, channel, version_code, version_name, min_supported_version_code,
			       package_name, COALESCE(download_url, ''), sha256, signing_cert_sha256,
			       file_size_bytes, release_notes, rollout_percentage, status, mandatory,
			       published_at, scheduled_release_at, COALESCE(r2_object_key, ''), is_landing_primary,
			       created_at, updated_at
			FROM app_releases
			ORDER BY version_code DESC
		`
		rows, err := h.DB.Pool.Query(r.Context(), query)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var rel models.AppRelease
				var r2Key string
				if err := rows.Scan(
					&rel.ID, &rel.Platform, &rel.Channel, &rel.VersionCode, &rel.VersionName,
					&rel.MinSupportedVersionCode, &rel.PackageName, &rel.DownloadURL, &rel.SHA256,
					&rel.SigningCertSHA256, &rel.FileSizeBytes, &rel.ReleaseNotes,
					&rel.RolloutPercentage, &rel.Status, &rel.Mandatory, &rel.PublishedAt,
					&rel.ScheduledReleaseAt, &r2Key, &rel.IsLandingPrimary, &rel.CreatedAt, &rel.UpdatedAt,
				); err == nil {
					rel.R2ObjectKey = &r2Key
					releases = append(releases, rel)
				}
			}
		}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"releases": releases,
	})
}

func (h *AdminHandler) QuickUnlockRelease(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	releaseID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid release ID")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		_, _ = h.DB.Pool.Exec(r.Context(), "UPDATE app_releases SET is_landing_primary = false WHERE platform = 'android'")
		query := `
			UPDATE app_releases
			SET scheduled_release_at = NULL, is_landing_primary = true, status = 'published', updated_at = NOW()
			WHERE id = $1
		`
		_, err := h.DB.Pool.Exec(r.Context(), query, releaseID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to unlock release: "+err.Error())
			return
		}

		var actorID *uuid.UUID
		if adminUser := middleware.GetUserFromContext(r.Context()); adminUser != nil {
			actorID = &adminUser.ID
		}
		h.recordAuditLog(r.Context(), actorID, "unlock_release", "app_releases", releaseID.String(), "Instantly unlocked release for immediate download", nil)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Release unlocked and published immediately",
	})
}

func (h *AdminHandler) GetLandingContent(w http.ResponseWriter, r *http.Request) {
	var content models.LandingContent
	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, is_active, hero_headline, hero_subtext, alert_banner_enabled,
			       alert_banner_text, alert_banner_type, alert_banner_link, screenshots, created_at, updated_at
			FROM landing_content
			WHERE is_active = true
			ORDER BY id ASC
			LIMIT 1
		`
		err := h.DB.Pool.QueryRow(r.Context(), query).Scan(
			&content.ID, &content.IsActive, &content.HeroHeadline, &content.HeroSubtext,
			&content.AlertBannerEnabled, &content.AlertBannerText, &content.AlertBannerType,
			&content.AlertBannerLink, &content.Screenshots, &content.CreatedAt, &content.UpdatedAt,
		)
		if err == nil {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"content": content,
			})
			return
		}
	}

	// Fallback
	content = models.LandingContent{
		ID:                 1,
		IsActive:           true,
		HeroHeadline:       "Music With style <3",
		HeroSubtext:        "Free, forever. Clean playback, synced lyrics, modules, and cloud sync.",
		AlertBannerEnabled: false,
		AlertBannerType:    "info",
		Screenshots:        json.RawMessage(`[]`),
		CreatedAt:          time.Now().UTC(),
		UpdatedAt:          time.Now().UTC(),
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"content": content,
	})
}

func (h *AdminHandler) UpdateLandingContent(w http.ResponseWriter, r *http.Request) {
	var req models.LandingContent
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse landing content")
		return
	}

	if req.HeroHeadline == "" {
		req.HeroHeadline = "Music With style <3"
	}
	if req.AlertBannerType == "" {
		req.AlertBannerType = "info"
	}
	if len(req.Screenshots) == 0 {
		req.Screenshots = json.RawMessage(`[]`)
	}

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			INSERT INTO landing_content (id, is_active, hero_headline, hero_subtext, alert_banner_enabled,
			                             alert_banner_text, alert_banner_type, alert_banner_link, screenshots, updated_at)
			VALUES (1, true, $1, $2, $3, $4, $5, $6, $7, NOW())
			ON CONFLICT (id) DO UPDATE SET
				hero_headline = EXCLUDED.hero_headline,
				hero_subtext = EXCLUDED.hero_subtext,
				alert_banner_enabled = EXCLUDED.alert_banner_enabled,
				alert_banner_text = EXCLUDED.alert_banner_text,
				alert_banner_type = EXCLUDED.alert_banner_type,
				alert_banner_link = EXCLUDED.alert_banner_link,
				screenshots = EXCLUDED.screenshots,
				updated_at = NOW()
			RETURNING id, is_active, hero_headline, hero_subtext, alert_banner_enabled,
			          alert_banner_text, alert_banner_type, alert_banner_link, screenshots, created_at, updated_at
		`
		err := h.DB.Pool.QueryRow(r.Context(), query,
			req.HeroHeadline, req.HeroSubtext, req.AlertBannerEnabled,
			req.AlertBannerText, req.AlertBannerType, req.AlertBannerLink, req.Screenshots,
		).Scan(
			&req.ID, &req.IsActive, &req.HeroHeadline, &req.HeroSubtext,
			&req.AlertBannerEnabled, &req.AlertBannerText, &req.AlertBannerType,
			&req.AlertBannerLink, &req.Screenshots, &req.CreatedAt, &req.UpdatedAt,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update landing content: "+err.Error())
			return
		}

		var actorID *uuid.UUID
		if adminUser := middleware.GetUserFromContext(r.Context()); adminUser != nil {
			actorID = &adminUser.ID
		}
		h.recordAuditLog(r.Context(), actorID, "update_landing_content", "landing_content", "1", "Updated landing page content and controls", nil)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"content": req,
	})
}

func (h *AdminHandler) recordAuditLog(ctx context.Context, actorID *uuid.UUID, action, targetType, targetID, reason string, meta interface{}) {
	if h.DB == nil || h.DB.Pool == nil {
		return
	}
	var rawMeta []byte
	if meta != nil {
		rawMeta, _ = json.Marshal(meta)
	} else {
		rawMeta = []byte("{}")
	}
	query := `
		INSERT INTO admin_audit_logs (actor_user_id, action, target_type, target_id, reason, metadata)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, _ = h.DB.Pool.Exec(ctx, query, actorID, action, targetType, targetID, reason, rawMeta)
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
