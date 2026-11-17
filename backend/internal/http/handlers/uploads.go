package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/config"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/storage"
)

type UploadHandler struct {
	DB      *database.DB
	Cfg     *config.Config
	Storage storage.StorageClient
}

func NewUploadHandler(db *database.DB, cfg *config.Config, st storage.StorageClient) *UploadHandler {
	return &UploadHandler{DB: db, Cfg: cfg, Storage: st}
}

type PresignRequest struct {
	AssetType   string `json:"asset_type"` // avatar, playlist_cover, announcement_banner, admin_asset
	ContentType string `json:"content_type"`
	ByteSize    int64  `json:"byte_size"`
}

type PresignResponse struct {
	AssetID   uuid.UUID `json:"asset_id"`
	UploadURL string    `json:"upload_url"`
	ObjectKey string    `json:"object_key"`
	ExpiresAt time.Time `json:"expires_at"`
}

func (h *UploadHandler) CreatePresignedURL(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	var req PresignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse presign request")
		return
	}

	// Validate content type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}
	if !allowedTypes[req.ContentType] {
		writeError(w, http.StatusBadRequest, "INVALID_CONTENT_TYPE", "Only JPEG, PNG, and WebP images are allowed")
		return
	}

	// Max 10MB
	if req.ByteSize <= 0 || req.ByteSize > 10*1024*1024 {
		writeError(w, http.StatusBadRequest, "INVALID_SIZE", "File size must be between 1 byte and 10 MB")
		return
	}

	assetID := uuid.New()
	extension := "jpg"
	if strings.Contains(req.ContentType, "png") {
		extension = "png"
	} else if strings.Contains(req.ContentType, "webp") {
		extension = "webp"
	}

	objectKey := fmt.Sprintf("%s/%s/%s.%s", req.AssetType, user.ID.String(), assetID.String(), extension)
	ttl := time.Duration(h.Cfg.R2PresignTTLSeconds) * time.Second
	expiresAt := time.Now().Add(ttl)

	var uploadURL string
	if h.Storage != nil {
		var err error
		uploadURL, err = h.Storage.PresignPutURL(r.Context(), h.Cfg.R2ImagesBucket, objectKey, req.ContentType, ttl)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "STORAGE_ERROR", "Failed to generate presigned URL")
			return
		}
	} else {
		// Fallback for local development without R2 credentials
		uploadURL = fmt.Sprintf("%s/v1/uploads/direct/%s", h.Cfg.PublicAPIBaseURL, objectKey)
	}

	// media_assets table was dropped in migration 00004. R2 presigned URLs work directly with object keys.
	writeJSON(w, http.StatusOK, PresignResponse{
		AssetID:   assetID,
		UploadURL: uploadURL,
		ObjectKey: objectKey,
		ExpiresAt: expiresAt,
	})
}

func (h *UploadHandler) CompleteUpload(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	var req struct {
		AssetID uuid.UUID `json:"asset_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse complete payload")
		return
	}

	objectKey := fmt.Sprintf("avatar/%s/%s.jpg", user.ID.String(), req.AssetID.String())
	publicURL := fmt.Sprintf("%s/%s", strings.TrimRight(h.Cfg.R2PublicImageBaseURL, "/"), objectKey)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":     "active",
		"asset_id":   req.AssetID,
		"public_url": publicURL,
	})
}
