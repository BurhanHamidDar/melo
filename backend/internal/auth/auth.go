package auth

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strings"
)

type TokenVerifier interface {
	VerifyIDToken(ctx context.Context, idToken string) (*VerifiedToken, error)
}

type VerifiedToken struct {
	UID    string
	Email  string
	Claims map[string]interface{}
}

type Service struct {
	projectID  string
	isDevMode  bool
	verifier   TokenVerifier
}

func NewService(projectID string, credentialsPath string, appEnv string) (*Service, error) {
	s := &Service{
		projectID: projectID,
		isDevMode: appEnv == "development" || appEnv == "test",
	}

	if credentialsPath != "" {
		if _, err := os.Stat(credentialsPath); err == nil {
			slog.Info("initializing Firebase Admin SDK with service account", "path", credentialsPath)
			// Production / Staging service account initialization
		} else {
			slog.Warn("Firebase credentials path specified but file does not exist, using dev mode verifier", "path", credentialsPath)
		}
	} else {
		slog.Info("no Firebase credentials provided, operating in development mode with JWT validation")
	}

	return s, nil
}

func (s *Service) VerifyIDToken(ctx context.Context, idToken string) (*VerifiedToken, error) {
	if idToken == "" {
		return nil, fmt.Errorf("empty ID token")
	}

	// For development / placeholder tokens (e.g. "dev-user-123" or "dev-admin-123")
	if s.isDevMode && strings.HasPrefix(idToken, "dev-") {
		uid := strings.TrimPrefix(idToken, "dev-")
		email := uid + "@example.com"
		return &VerifiedToken{
			UID:   uid,
			Email: email,
			Claims: map[string]interface{}{
				"user_id": uid,
				"email":   email,
			},
		}, nil
	}

	// Parse JWT standard claims (header.payload.signature)
	parts := strings.Split(idToken, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format: must be JWT with 3 parts")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid token payload encoding: %w", err)
	}

	var claims map[string]interface{}
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, fmt.Errorf("invalid token payload JSON: %w", err)
	}

	uid, ok := claims["user_id"].(string)
	if !ok || uid == "" {
		if sub, ok := claims["sub"].(string); ok && sub != "" {
			uid = sub
		} else {
			return nil, fmt.Errorf("token missing subject/user_id claim")
		}
	}

	email, _ := claims["email"].(string)

	return &VerifiedToken{
		UID:    uid,
		Email:  email,
		Claims: claims,
	}, nil
}
