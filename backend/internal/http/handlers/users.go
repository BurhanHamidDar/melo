package handlers

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/models"
)

var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_]{3,30}$`)

type UserHandler struct {
	DB *database.DB
}

func NewUserHandler(db *database.DB) *UserHandler {
	return &UserHandler{DB: db}
}

func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"user": user,
	})
}

func (h *UserHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	var req models.UserProfileUpdate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse update payload")
		return
	}

	if req.Username != nil {
		trimmed := strings.TrimSpace(*req.Username)
		if trimmed != "" && !usernameRegex.MatchString(trimmed) {
			writeError(w, http.StatusBadRequest, "INVALID_USERNAME", "Username must be 3-30 alphanumeric characters or underscores")
			return
		}
	}

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			UPDATE users 
			SET display_name = COALESCE($1, display_name),
			    bio = COALESCE($2, bio),
			    username = COALESCE($3, username),
			    profile_visibility = COALESCE($4, profile_visibility),
			    updated_at = NOW()
			WHERE id = $5
			RETURNING id, firebase_uid, email, username, display_name, bio, avatar_asset_id, profile_visibility, account_status, created_at, updated_at, last_seen_at
		`
		var updated models.User
		err := h.DB.Pool.QueryRow(r.Context(), query, req.DisplayName, req.Bio, req.Username, req.ProfileVisibility, user.ID).Scan(
			&updated.ID, &updated.FirebaseUID, &updated.Email, &updated.Username, &updated.DisplayName,
			&updated.Bio, &updated.AvatarAssetID, &updated.ProfileVisibility, &updated.AccountStatus,
			&updated.CreatedAt, &updated.UpdatedAt, &updated.LastSeenAt,
		)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique") {
				writeError(w, http.StatusConflict, "USERNAME_TAKEN", "This username is already taken")
				return
			}
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update profile")
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"user": updated})
		return
	}

	// Dev mock response
	if req.DisplayName != nil {
		user.DisplayName = req.DisplayName
	}
	if req.Bio != nil {
		user.Bio = req.Bio
	}
	if req.Username != nil {
		user.Username = req.Username
	}
	if req.ProfileVisibility != nil {
		user.ProfileVisibility = *req.ProfileVisibility
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"user": user})
}

func (h *UserHandler) CheckUsername(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid payload")
		return
	}

	trimmed := strings.TrimSpace(req.Username)
	if !usernameRegex.MatchString(trimmed) {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"available": false,
			"reason":    "Username must be 3-30 alphanumeric characters or underscores",
		})
		return
	}

	available := true
	if h.DB != nil && h.DB.Pool != nil {
		var exists bool
		_ = h.DB.Pool.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", trimmed).Scan(&exists)
		available = !exists
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"available": available,
	})
}

func (h *UserHandler) RequestDeletion(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		_, _ = h.DB.Pool.Exec(r.Context(), "UPDATE users SET account_status = 'deletion_pending', updated_at = NOW() WHERE id = $1", user.ID)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Account marked for deletion. Data cleanup will be performed.",
	})
}

func (h *UserHandler) ExportData(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"profile":   user,
		"exported_at": "now",
	})
}

type RegisterDeviceRequest struct {
	DeviceInstallID      string  `json:"device_install_id"`
	Platform             string  `json:"platform"`
	AppVersionCode       *int64  `json:"app_version_code,omitempty"`
	AppVersionName       *string `json:"app_version_name,omitempty"`
	DeviceLabel          *string `json:"device_label,omitempty"`
	FCMToken             *string `json:"fcm_token,omitempty"`
	NotificationsEnabled bool    `json:"notifications_enabled"`
}

func (h *UserHandler) RegisterDevice(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	var req RegisterDeviceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse device payload")
		return
	}

	installUUID, err := uuid.Parse(req.DeviceInstallID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_DEVICE_ID", "device_install_id must be a valid UUID")
		return
	}

	platform := strings.TrimSpace(req.Platform)
	if platform == "" {
		platform = "android"
	}

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			INSERT INTO user_devices (
				user_id, device_install_id, platform, app_version_code, app_version_name,
				device_label, fcm_token, notifications_enabled, last_seen_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
			ON CONFLICT (user_id, device_install_id) DO UPDATE SET
				platform = EXCLUDED.platform,
				app_version_code = EXCLUDED.app_version_code,
				app_version_name = EXCLUDED.app_version_name,
				device_label = EXCLUDED.device_label,
				fcm_token = EXCLUDED.fcm_token,
				notifications_enabled = EXCLUDED.notifications_enabled,
				last_seen_at = NOW(),
				updated_at = NOW()
			RETURNING id, user_id, device_install_id, platform, app_version_code, app_version_name,
			          device_label, fcm_token, notifications_enabled, last_seen_at, created_at, updated_at
		`
		var device models.UserDevice
		err := h.DB.Pool.QueryRow(r.Context(), query,
			user.ID, installUUID, platform, req.AppVersionCode, req.AppVersionName,
			req.DeviceLabel, req.FCMToken, req.NotificationsEnabled,
		).Scan(
			&device.ID, &device.UserID, &device.DeviceInstallID, &device.Platform,
			&device.AppVersionCode, &device.AppVersionName, &device.DeviceLabel,
			&device.FCMToken, &device.NotificationsEnabled, &device.LastSeenAt,
			&device.CreatedAt, &device.UpdatedAt,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to register device: "+err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"device": device})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"status": "registered"})
}

func (h *UserHandler) UnregisterDevice(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	installIDStr := r.PathValue("install_id")
	installUUID, err := uuid.Parse(installIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_DEVICE_ID", "install_id must be a valid UUID")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		_, err := h.DB.Pool.Exec(r.Context(), "DELETE FROM user_devices WHERE user_id = $1 AND device_install_id = $2", user.ID, installUUID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to unregister device")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"status": "unregistered"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(models.ErrorResponse{
		Error: models.APIError{
			Code:    code,
			Message: message,
		},
	})
}
