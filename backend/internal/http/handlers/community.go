package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/models"
)

type CommunityHandler struct {
	DB *database.DB
}

func NewCommunityHandler(db *database.DB) *CommunityHandler {
	return &CommunityHandler{DB: db}
}

type CommunityPlaylistCard struct {
	ID          uuid.UUID  `json:"id"`
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	CoverURL    *string    `json:"cover_url,omitempty"`
	OwnerName   string     `json:"owner_name"`
	TracksCount int        `json:"tracks_count"`
	Followers   int        `json:"followers"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (h *CommunityHandler) BrowseCommunityPlaylists(w http.ResponseWriter, r *http.Request) {
	playlists := make([]CommunityPlaylistCard, 0)

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT p.id, p.title, p.description, COALESCE(u.display_name, u.username, 'Community User') as owner_name,
			       COUNT(DISTINCT pt.id) as tracks_count,
			       COUNT(DISTINCT pf.user_id) as followers,
			       p.created_at, p.updated_at
			FROM playlists p
			LEFT JOIN users u ON p.owner_user_id = u.id
			LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
			LEFT JOIN playlist_follows pf ON p.id = pf.playlist_id
			WHERE p.visibility = 'public' AND p.deleted_at IS NULL
			GROUP BY p.id, p.title, p.description, u.display_name, u.username, p.created_at, p.updated_at
			ORDER BY followers DESC, p.updated_at DESC
			LIMIT 50
		`
		rows, err := h.DB.Pool.Query(r.Context(), query)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var card CommunityPlaylistCard
				if err := rows.Scan(&card.ID, &card.Title, &card.Description, &card.OwnerName, &card.TracksCount, &card.Followers, &card.CreatedAt, &card.UpdatedAt); err == nil {
					playlists = append(playlists, card)
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"playlists": playlists,
		"count":     len(playlists),
	})
}

func (h *CommunityHandler) GetPublicProfile(w http.ResponseWriter, r *http.Request) {
	username := r.PathValue("username")
	if username == "" {
		writeError(w, http.StatusBadRequest, "INVALID_USERNAME", "Username is required")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		var p models.PublicProfile
		query := `
			SELECT id, username, display_name, bio, created_at
			FROM users
			WHERE username ILIKE $1 AND profile_visibility = 'public' AND account_status = 'active'
		`
		err := h.DB.Pool.QueryRow(r.Context(), query, username).Scan(
			&p.ID, &p.Username, &p.DisplayName, &p.Bio, &p.CreatedAt,
		)
		if err != nil {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "Public profile not found")
			return
		}

		// Fetch user's public playlists
		publicPlaylists := make([]models.Playlist, 0)
		pRows, err := h.DB.Pool.Query(r.Context(), `
			SELECT id, owner_user_id, title, description, visibility, is_collaborative, revision, created_at, updated_at
			FROM playlists
			WHERE owner_user_id = $1 AND visibility = 'public' AND deleted_at IS NULL
			ORDER BY created_at DESC
		`, p.ID)
		if err == nil {
			defer pRows.Close()
			for pRows.Next() {
				var pl models.Playlist
				if err := pRows.Scan(&pl.ID, &pl.OwnerUserID, &pl.Title, &pl.Description, &pl.Visibility, &pl.IsCollaborative, &pl.Revision, &pl.CreatedAt, &pl.UpdatedAt); err == nil {
					publicPlaylists = append(publicPlaylists, pl)
				}
			}
		}

		writeJSON(w, http.StatusOK, map[string]interface{}{
			"profile":   p,
			"playlists": publicPlaylists,
		})
		return
	}

	writeError(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Database unavailable")
}

func (h *CommunityHandler) CreateReport(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	var reporterID *uuid.UUID
	if user != nil {
		reporterID = &user.ID
	}

	var req models.CreateReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse report request")
		return
	}

	if req.TargetType == "" || req.Reason == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "TargetType and Reason are required")
		return
	}
	if req.TargetType != "profile" && req.TargetType != "playlist" && req.TargetType != "announcement" && req.TargetType != "other" {
		writeError(w, http.StatusBadRequest, "INVALID_TARGET_TYPE", "TargetType must be profile, playlist, announcement, or other")
		return
	}

	reportID := uuid.New()
	if h.DB != nil && h.DB.Pool != nil {
		query := `
			INSERT INTO reports (id, reporter_user_id, target_type, target_id, reason, details, status, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, 'open', NOW(), NOW())
		`
		_, err := h.DB.Pool.Exec(r.Context(), query, reportID, reporterID, req.TargetType, req.TargetID, req.Reason, req.Details)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to submit report")
			return
		}
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"report_id": reportID,
		"message":   "Report submitted successfully and queued for moderation",
	})
}

func (h *CommunityHandler) ListReports(w http.ResponseWriter, r *http.Request) {
	reports := make([]models.Report, 0)

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, reporter_user_id, target_type, target_id, reason, details, status, created_at, updated_at
			FROM reports
			ORDER BY created_at DESC
			LIMIT 100
		`
		rows, err := h.DB.Pool.Query(r.Context(), query)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var rep models.Report
				if err := rows.Scan(&rep.ID, &rep.ReporterUserID, &rep.TargetType, &rep.TargetID, &rep.Reason, &rep.Details, &rep.Status, &rep.CreatedAt, &rep.UpdatedAt); err == nil {
					reports = append(reports, rep)
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"reports": reports,
		"count":   len(reports),
	})
}

func (h *CommunityHandler) UpdateReport(w http.ResponseWriter, r *http.Request) {
	admin := middleware.GetUserFromContext(r.Context())
	reportID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid report UUID")
		return
	}

	var req models.UpdateReportStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse update payload")
		return
	}

	if req.Status != "open" && req.Status != "reviewing" && req.Status != "resolved" && req.Status != "dismissed" {
		writeError(w, http.StatusBadRequest, "INVALID_STATUS", "Status must be open, reviewing, resolved, or dismissed")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			UPDATE reports
			SET status = $1, moderator_user_id = $2, resolution_note = $3, updated_at = NOW()
			WHERE id = $4
		`
		var modID *uuid.UUID
		if admin != nil {
			modID = &admin.ID
		}
		_, err := h.DB.Pool.Exec(r.Context(), query, req.Status, modID, req.ResolutionNote, reportID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update report")
			return
		}

		// Record audit log
		auditQuery := `
			INSERT INTO admin_audit_logs (actor_user_id, action, target_type, target_id, reason, metadata)
			VALUES ($1, 'update_report_status', 'report', $2, $3, $4)
		`
		meta, _ := json.Marshal(map[string]interface{}{
			"status":          req.Status,
			"resolution_note": req.ResolutionNote,
		})
		_, _ = h.DB.Pool.Exec(r.Context(), auditQuery, modID, reportID.String(), "Moderation action taken", meta)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Report status updated successfully",
	})
}
