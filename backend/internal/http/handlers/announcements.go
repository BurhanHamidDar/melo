package handlers

import (
	"net/http"

	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/models"
)

type AnnouncementHandler struct {
	DB *database.DB
}

func NewAnnouncementHandler(db *database.DB) *AnnouncementHandler {
	return &AnnouncementHandler{DB: db}
}

func (h *AnnouncementHandler) ListActive(w http.ResponseWriter, r *http.Request) {
	announcements := make([]models.Announcement, 0)

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, title, body, image_asset_id, severity, target_channel,
			       target_min_version_code, starts_at, ends_at, status, created_at, updated_at
			FROM announcements
			WHERE status = 'published'
			  AND (starts_at IS NULL OR starts_at <= NOW())
			  AND (ends_at IS NULL OR ends_at >= NOW())
			ORDER BY created_at DESC
		`
		rows, err := h.DB.Pool.Query(r.Context(), query)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var a models.Announcement
				if err := rows.Scan(&a.ID, &a.Title, &a.Body, &a.ImageAssetID, &a.Severity, &a.TargetChannel, &a.TargetMinVersionCode, &a.StartsAt, &a.EndsAt, &a.Status, &a.CreatedAt, &a.UpdatedAt); err == nil {
					announcements = append(announcements, a)
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"announcements": announcements,
	})
}
