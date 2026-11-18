package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/auth"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/models"
)

type contextKey string

const (
	UserContextKey        contextKey = "user"
	AdminRoleContextKey   contextKey = "admin_role"
	RequestIDContextKey   contextKey = "request_id"
)

type AuthMiddleware struct {
	AuthService *auth.Service
	DB          *database.DB
}

func NewAuthMiddleware(authService *auth.Service, db *database.DB) *AuthMiddleware {
	return &AuthMiddleware{
		AuthService: authService,
		DB:          db,
	}
}

func (m *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing or invalid Authorization header")
			return
		}

		idToken := strings.TrimPrefix(authHeader, "Bearer ")
		verifiedToken, err := m.AuthService.VerifyIDToken(r.Context(), idToken)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "INVALID_TOKEN", err.Error())
			return
		}

		// Ensure user exists in Neon database via idempotent upsert
		user, err := m.ensureUserExists(r.Context(), verifiedToken)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to resolve user account")
			return
		}

		// Verify account status
		if user.AccountStatus == "suspended" || user.AccountStatus == "banned" {
			writeError(w, http.StatusForbidden, "ACCOUNT_SUSPENDED", "Your account has been suspended or banned")
			return
		}

		// Attach user to context
		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next(w, r.WithContext(ctx))
	}
}

func (m *AuthMiddleware) RequireAdmin(requiredRole string, next http.HandlerFunc) http.HandlerFunc {
	return m.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		user := GetUserFromContext(r.Context())
		if user == nil {
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
			return
		}

		role, err := m.checkAdminRole(r.Context(), user)
		if err != nil || role == "" {
			writeError(w, http.StatusForbidden, "FORBIDDEN", "Administrative privilege required")
			return
		}

		// Role hierarchy: super_admin > content_manager > moderator
		if requiredRole == "super_admin" && role != "super_admin" {
			writeError(w, http.StatusForbidden, "FORBIDDEN", "Super admin privilege required")
			return
		}

		ctx := context.WithValue(r.Context(), AdminRoleContextKey, role)
		next(w, r.WithContext(ctx))
	})
}

func (m *AuthMiddleware) ensureUserExists(ctx context.Context, token *auth.VerifiedToken) (*models.User, error) {
	// If database is not connected (e.g. initial dev bootstrap), generate mock user
	if m.DB == nil || m.DB.Pool == nil {
		mockID := uuid.NewMD5(uuid.NameSpaceDNS, []byte(token.UID))
		return &models.User{
			ID:                mockID,
			FirebaseUID:       token.UID,
			Email:             &token.Email,
			ProfileVisibility: "private",
			AccountStatus:     "active",
		}, nil
	}

	query := `
		INSERT INTO users (firebase_uid, email, account_status, profile_visibility)
		VALUES ($1, $2, 'active', 'private')
		ON CONFLICT (firebase_uid) 
		DO UPDATE SET last_seen_at = NOW(), email = EXCLUDED.email
		RETURNING id, firebase_uid, email, username, display_name, bio, avatar_asset_id, profile_visibility, account_status, created_at, updated_at, last_seen_at
	`

	var user models.User
	err := m.DB.Pool.QueryRow(ctx, query, token.UID, token.Email).Scan(
		&user.ID,
		&user.FirebaseUID,
		&user.Email,
		&user.Username,
		&user.DisplayName,
		&user.Bio,
		&user.AvatarAssetID,
		&user.ProfileVisibility,
		&user.AccountStatus,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastSeenAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (m *AuthMiddleware) checkAdminRole(ctx context.Context, user *models.User) (string, error) {
	if user == nil {
		return "", fmt.Errorf("user not found")
	}

	// 1. Dev token bypass only for the explicit dev-admin account
	if m.AuthService != nil && m.AuthService.IsDevMode() && user.FirebaseUID == "admin-1" {
		return "super_admin", nil
	}

	userEmail := ""
	if user.Email != nil {
		userEmail = strings.ToLower(strings.TrimSpace(*user.Email))
	}

	// 2. Strict restriction: Accounts must be burhanhamid912@gmail.com or miry4698@gmail.com
	if user.FirebaseUID != "admin-1" && userEmail != "burhanhamid912@gmail.com" && userEmail != "miry4698@gmail.com" {
		return "", fmt.Errorf("unauthorized admin account: %s", userEmail)
	}

	if m.DB == nil || m.DB.Pool == nil {
		if userEmail == "burhanhamid912@gmail.com" || userEmail == "miry4698@gmail.com" || user.FirebaseUID == "admin-1" {
			return "super_admin", nil
		}
		return "", fmt.Errorf("database unavailable")
	}

	// 3. Ensure primary admin accounts are auto-promoted/synced in admin_roles
	if userEmail == "burhanhamid912@gmail.com" || userEmail == "miry4698@gmail.com" {
		_, _ = m.DB.Pool.Exec(ctx, `
			INSERT INTO admin_roles (user_id, role)
			VALUES ($1, 'super_admin')
			ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin'
		`, user.ID)
		return "super_admin", nil
	}

	var role string
	err := m.DB.Pool.QueryRow(ctx, "SELECT role FROM admin_roles WHERE user_id = $1", user.ID).Scan(&role)
	if err != nil {
		return "", err
	}
	return role, nil
}

func GetUserFromContext(ctx context.Context) *models.User {
	if user, ok := ctx.Value(UserContextKey).(*models.User); ok {
		return user
	}
	return nil
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
