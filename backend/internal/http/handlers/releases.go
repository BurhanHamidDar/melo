package handlers

import (
	"net/http"
	"strconv"

	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/models"
)

type ReleaseHandler struct {
	DB *database.DB
}

func NewReleaseHandler(db *database.DB) *ReleaseHandler {
	return &ReleaseHandler{DB: db}
}

func (h *ReleaseHandler) CheckUpdate(w http.ResponseWriter, r *http.Request) {
	channel := r.URL.Query().Get("channel")
	if channel != "beta" {
		channel = "stable"
	}

	clientVersionCode, _ := strconv.ParseInt(r.URL.Query().Get("version_code"), 10, 64)

	var release models.AppRelease
	var found bool

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, platform, channel, version_code, version_name, min_supported_version_code,
			       package_name, COALESCE(download_url, ''), sha256, signing_cert_sha256,
			       file_size_bytes, release_notes, rollout_percentage, status, mandatory, published_at, created_at, updated_at
			FROM app_releases
			WHERE platform = 'android' AND channel = $1 AND status = 'published'
			ORDER BY version_code DESC
			LIMIT 1
		`
		err := h.DB.Pool.QueryRow(r.Context(), query, channel).Scan(
			&release.ID, &release.Platform, &release.Channel, &release.VersionCode, &release.VersionName,
			&release.MinSupportedVersionCode, &release.PackageName, &release.DownloadURL, &release.SHA256,
			&release.SigningCertSHA256, &release.FileSizeBytes, &release.ReleaseNotes,
			&release.RolloutPercentage, &release.Status, &release.Mandatory, &release.PublishedAt,
			&release.CreatedAt, &release.UpdatedAt,
		)
		if err == nil {
			found = true
		}
	}

	// Fallback / initial seed release if no DB record exists yet
	if !found {
		release = models.AppRelease{
			Platform:                "android",
			Channel:                 channel,
			VersionCode:             13,
			VersionName:             "2.0.0-rc1",
			MinSupportedVersionCode: 12,
			PackageName:             "com.music.melo",
			DownloadURL:             "https://github.com/techxsarwar/melo/releases/latest",
			SHA256:                  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			SigningCertSHA256:       "",
			FileSizeBytes:           51389458,
			ReleaseNotes:            "Melo V2 Release: User accounts, cloud sync, and improved performance.",
			RolloutPercentage:       100,
			Status:                  "published",
			Mandatory:               false,
		}
	}

	hasUpdate := release.VersionCode > clientVersionCode
	isMandatory := (clientVersionCode > 0 && clientVersionCode < release.MinSupportedVersionCode) || release.Mandatory

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"has_update":   hasUpdate,
		"is_mandatory": isMandatory,
		"release":      release,
	})
}
