package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/auth"
	"github.com/melo-v2/backend/internal/http/handlers"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/models"
)

func TestPlaylistAndCommunityHandlers(t *testing.T) {
	authService, _ := auth.NewService("melo-v2", "", "development")
	authMiddleware := middleware.NewAuthMiddleware(authService, nil)

	playlistH := handlers.NewPlaylistHandler(nil)
	communityH := handlers.NewCommunityHandler(nil)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/playlists", authMiddleware.RequireAuth(playlistH.CreatePlaylist))
	mux.HandleFunc("GET /v1/community/playlists", communityH.BrowseCommunityPlaylists)
	mux.HandleFunc("POST /v1/community/reports", authMiddleware.RequireAuth(communityH.CreateReport))
	mux.HandleFunc("GET /v1/admin/reports", authMiddleware.RequireAdmin("moderator", communityH.ListReports))

	// 1. Test Browse Community Playlists (public)
	req := httptest.NewRequest("GET", "/v1/community/playlists", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for community browse, got %d: %s", w.Code, w.Body.String())
	}

	var browseResp struct {
		Playlists []handlers.CommunityPlaylistCard `json:"playlists"`
		Count     int                              `json:"count"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &browseResp); err != nil {
		t.Fatalf("failed to decode browse response: %v", err)
	}

	// 2. Test Create Playlist (with dev token)
	createBody, _ := json.Marshal(models.CreatePlaylistRequest{
		Title:       "Synthwave Night",
		Description: strPtr("Retro synth vibes for late night coding"),
		Visibility:  "public",
	})
	req = httptest.NewRequest("POST", "/v1/playlists", bytes.NewReader(createBody))
	req.Header.Set("Authorization", "Bearer dev-test-token")
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created for playlist creation, got %d: %s", w.Code, w.Body.String())
	}

	// 3. Test Create Report (validation & submission)
	reportTargetID := uuid.New()
	reportPayload, _ := json.Marshal(models.CreateReportRequest{
		TargetType: "playlist",
		TargetID:   &reportTargetID,
		Reason:     "Spam title",
		Details:    strPtr("Contains promotional spam keywords"),
	})
	req = httptest.NewRequest("POST", "/v1/community/reports", bytes.NewReader(reportPayload))
	req.Header.Set("Authorization", "Bearer dev-test-token")
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created for report submission, got %d: %s", w.Code, w.Body.String())
	}

	// 4. Test List Reports (moderator role required)
	req = httptest.NewRequest("GET", "/v1/admin/reports", nil)
	req.Header.Set("Authorization", "Bearer dev-test-token")
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	// Since mock user has super_admin in dev mode, expect 200 OK
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for admin list reports, got %d: %s", w.Code, w.Body.String())
	}
}

func strPtr(s string) *string {
	return &s
}
