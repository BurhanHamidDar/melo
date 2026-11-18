package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/config"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/models"
	"github.com/melo-v2/backend/internal/storage"
)

type ReleaseHandler struct {
	DB  *database.DB
	CFG *config.Config
	R2  storage.StorageClient
}

func NewReleaseHandler(db *database.DB, cfg *config.Config, r2 storage.StorageClient) *ReleaseHandler {
	return &ReleaseHandler{DB: db, CFG: cfg, R2: r2}
}

type LandingReleaseDTO struct {
	Platform      string `json:"platform"`
	Channel       string `json:"channel"`
	VersionCode   int64  `json:"version_code"`
	VersionName   string `json:"version_name"`
	PackageName   string `json:"package_name"`
	DownloadURL   string `json:"download_url,omitempty"` // Strictly omitted if status == "scheduled"
	SHA256        string `json:"sha256"`
	FileSizeBytes int64  `json:"file_size_bytes"`
	ReleaseNotes  string `json:"release_notes"`
	Status        string `json:"status"`
	DownloadCount int64  `json:"download_count"`
}

type LandingStatusResponse struct {
	Status               string                 `json:"status"` // "scheduled" or "live"
	ServerTime           time.Time              `json:"server_time"`
	ScheduledReleaseAt   *time.Time             `json:"scheduled_release_at,omitempty"`
	TimeRemainingSeconds int64                  `json:"time_remaining_seconds"`
	Release              *LandingReleaseDTO     `json:"release,omitempty"`
	LandingContent       *models.LandingContent `json:"landing_content,omitempty"`
	TotalDownloads       int64                  `json:"total_downloads"`
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
			  AND (scheduled_release_at IS NULL OR scheduled_release_at <= NOW())
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
			DownloadURL:             "/v1/releases/download?channel=" + channel,
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
	isMandatory := release.Mandatory || (release.MinSupportedVersionCode > 1 && clientVersionCode > 0 && clientVersionCode < release.MinSupportedVersionCode)

	if release.DownloadURL == "" {
		release.DownloadURL = "/v1/releases/download?channel=" + release.Channel
	}
	if !strings.HasPrefix(release.DownloadURL, "http://") && !strings.HasPrefix(release.DownloadURL, "https://") {
		release.DownloadURL = h.absoluteURL(r, release.DownloadURL)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"has_update":   hasUpdate,
		"is_mandatory": isMandatory,
		"release":      release,
	})
}

func (h *ReleaseHandler) absoluteURL(r *http.Request, raw string) string {
	if raw == "" || strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	if h.CFG != nil && h.CFG.PublicAPIBaseURL != "" {
		base := strings.TrimRight(h.CFG.PublicAPIBaseURL, "/")
		if !strings.HasPrefix(raw, "/") {
			raw = "/" + raw
		}
		return base + raw
	}
	scheme := "http"
	if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	host := r.Host
	if host == "" {
		host = "localhost:8080"
	}
	if !strings.HasPrefix(raw, "/") {
		raw = "/" + raw
	}
	return fmt.Sprintf("%s://%s%s", scheme, host, raw)
}

// LandingStatus provides public data for the landing page hero and release countdown
func (h *ReleaseHandler) LandingStatus(w http.ResponseWriter, r *http.Request) {
	now := time.Now().UTC()

	// 1. Fetch Landing Page Content
	var content models.LandingContent
	var contentFound bool
	if h.DB != nil && h.DB.Pool != nil {
		qContent := `
			SELECT id, is_active, hero_headline, hero_subtext, alert_banner_enabled,
			       alert_banner_text, alert_banner_type, alert_banner_link, screenshots, created_at, updated_at
			FROM landing_content
			WHERE is_active = true
			ORDER BY id ASC
			LIMIT 1
		`
		err := h.DB.Pool.QueryRow(r.Context(), qContent).Scan(
			&content.ID, &content.IsActive, &content.HeroHeadline, &content.HeroSubtext,
			&content.AlertBannerEnabled, &content.AlertBannerText, &content.AlertBannerType,
			&content.AlertBannerLink, &content.Screenshots, &content.CreatedAt, &content.UpdatedAt,
		)
		if err == nil {
			contentFound = true
		}
	}

	if !contentFound {
		content = models.LandingContent{
			ID:                 1,
			IsActive:           true,
			HeroHeadline:       "Music With style <3",
			HeroSubtext:        "Free, forever. Clean playback, synced lyrics, modules, and cloud sync.",
			AlertBannerEnabled: false,
			AlertBannerType:    "info",
			Screenshots:        json.RawMessage(`[]`),
			CreatedAt:          now,
			UpdatedAt:          now,
		}
	}

	// 2. Fetch Primary or Latest Release
	var release models.AppRelease
	var releaseFound bool
	var dlCount int64
	var totalDlCount int64
	if h.DB != nil && h.DB.Pool != nil {
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT COALESCE(SUM(download_count), 0) FROM app_releases").Scan(&totalDlCount)

		qRelease := `
			SELECT id, platform, channel, version_code, version_name, package_name,
			       COALESCE(download_url, ''), sha256, file_size_bytes, release_notes,
			       status, is_landing_primary, scheduled_release_at, COALESCE(r2_object_key, ''),
			       COALESCE(download_count, 0)
			FROM app_releases
			WHERE platform = 'android'
			ORDER BY is_landing_primary DESC, version_code DESC, created_at DESC
			LIMIT 1
		`
		var r2Key string
		err := h.DB.Pool.QueryRow(r.Context(), qRelease).Scan(
			&release.ID, &release.Platform, &release.Channel, &release.VersionCode, &release.VersionName,
			&release.PackageName, &release.DownloadURL, &release.SHA256, &release.FileSizeBytes,
			&release.ReleaseNotes, &release.Status, &release.IsLandingPrimary, &release.ScheduledReleaseAt, &r2Key,
			&dlCount,
		)
		if err == nil {
			release.R2ObjectKey = &r2Key
			releaseFound = true
		}
	}

	if !releaseFound {
		release = models.AppRelease{
			Platform:          "android",
			Channel:           "stable",
			VersionCode:       13,
			VersionName:       "2.0.0-rc1",
			PackageName:       "com.music.melo",
			DownloadURL:       "/v1/releases/download?channel=stable",
			SHA256:            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			FileSizeBytes:     51389458,
			ReleaseNotes:      "Melo V2 Release: User accounts, cloud sync, and improved performance.",
			Status:            "published",
			IsLandingPrimary:  true,
		}
	}

	// Determine if the release is scheduled in the future
	isScheduled := false
	var remainingSeconds int64 = 0

	if release.ScheduledReleaseAt != nil && now.Before(*release.ScheduledReleaseAt) {
		isScheduled = true
		remainingSeconds = int64(release.ScheduledReleaseAt.Sub(now).Seconds())
	}

	dto := &LandingReleaseDTO{
		Platform:      release.Platform,
		Channel:       release.Channel,
		VersionCode:   release.VersionCode,
		VersionName:   release.VersionName,
		PackageName:   release.PackageName,
		SHA256:        release.SHA256,
		FileSizeBytes: release.FileSizeBytes,
		ReleaseNotes:  release.ReleaseNotes,
		Status:        release.Status,
		DownloadCount: dlCount,
	}

	statusStr := "live"
	if isScheduled {
		statusStr = "scheduled"
		// ANTI-BYPASS SECURITY GUARANTEE: Never leak download URL or R2 object key when locked!
		dto.DownloadURL = ""
	} else {
		dto.DownloadURL = "/v1/releases/download?channel=" + release.Channel
	}

	resp := LandingStatusResponse{
		Status:               statusStr,
		ServerTime:           now,
		ScheduledReleaseAt:   release.ScheduledReleaseAt,
		TimeRemainingSeconds: remainingSeconds,
		Release:              dto,
		LandingContent:       &content,
		TotalDownloads:       totalDlCount,
	}

	writeJSON(w, http.StatusOK, resp)
}

// DownloadRelease gates binary access strictly against the release schedule
func (h *ReleaseHandler) DownloadRelease(w http.ResponseWriter, r *http.Request) {
	channel := r.URL.Query().Get("channel")
	if channel != "beta" {
		channel = "stable"
	}

	var release models.AppRelease
	var found bool

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, platform, channel, version_code, version_name,
			       COALESCE(download_url, ''), sha256, scheduled_release_at, COALESCE(r2_object_key, ''), is_landing_primary
			FROM app_releases
			WHERE platform = 'android' AND (channel = $1 OR is_landing_primary = true)
			ORDER BY is_landing_primary DESC, version_code DESC
			LIMIT 1
		`
		var r2Key string
		err := h.DB.Pool.QueryRow(r.Context(), query, channel).Scan(
			&release.ID, &release.Platform, &release.Channel, &release.VersionCode, &release.VersionName,
			&release.DownloadURL, &release.SHA256, &release.ScheduledReleaseAt, &r2Key, &release.IsLandingPrimary,
		)
		if err == nil {
			release.R2ObjectKey = &r2Key
			found = true
		}
	}

	if !found {
		http.Redirect(w, r, "https://github.com/techxsarwar/melo/releases/latest", http.StatusTemporaryRedirect)
		return
	}

	// SERVER-SIDE ANTI-BYPASS ENFORCEMENT
	now := time.Now().UTC()
	if release.ScheduledReleaseAt != nil && now.Before(*release.ScheduledReleaseAt) {
		writeError(w, http.StatusForbidden, "RELEASE_LOCKED",
			fmt.Sprintf("This release is scheduled for release at %s UTC and cannot be downloaded yet.", release.ScheduledReleaseAt.Format(time.RFC3339)))
		return
	}

	// Increment download count asynchronously
	if h.DB != nil && h.DB.Pool != nil {
		go func(relID uuid.UUID) {
			_, _ = h.DB.Pool.Exec(context.Background(),
				"UPDATE app_releases SET download_count = download_count + 1 WHERE id = $1",
				relID,
			)
		}(release.ID)
	}

	// If R2 storage is configured and key is present, issue presigned GET redirect
	if release.R2ObjectKey != nil && *release.R2ObjectKey != "" && h.R2 != nil && h.CFG != nil && h.CFG.R2ReleasesBucket != "" {
		presignedURL, err := h.R2.PresignGetURL(r.Context(), h.CFG.R2ReleasesBucket, *release.R2ObjectKey, 15*time.Minute)
		if err == nil && presignedURL != "" {
			http.Redirect(w, r, presignedURL, http.StatusTemporaryRedirect)
			return
		}
	}

	// If direct download URL is configured, redirect
	if release.DownloadURL != "" {
		http.Redirect(w, r, release.DownloadURL, http.StatusTemporaryRedirect)
		return
	}

	http.Redirect(w, r, "https://github.com/techxsarwar/melo/releases/latest", http.StatusTemporaryRedirect)
}

func (h *ReleaseHandler) ServeReleaseFile(w http.ResponseWriter, r *http.Request) {
	filename := filepath.Base(r.PathValue("filename"))
	if filename == "" || filename == "." {
		http.NotFound(w, r)
		return
	}

	filePath := filepath.Join("uploads", "releases", filename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "application/vnd.android.package-archive")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	http.ServeFile(w, r, filePath)
}
