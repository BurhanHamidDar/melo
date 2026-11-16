package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/auth"
	"github.com/melo-v2/backend/internal/config"
	"github.com/melo-v2/backend/internal/http/handlers"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/models"
)

func TestHealthEndpoints(t *testing.T) {
	healthH := handlers.NewHealthHandler(nil)

	// Health
	req := httptest.NewRequest("GET", "/v1/health", nil)
	rr := httptest.NewRecorder()
	healthH.Health(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var res map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatalf("failed decoding json: %v", err)
	}
	if res["status"] != "healthy" {
		t.Errorf("expected status healthy, got %v", res["status"])
	}

	// Ready
	reqReady := httptest.NewRequest("GET", "/v1/ready", nil)
	rrReady := httptest.NewRecorder()
	healthH.Ready(rrReady, reqReady)

	if rrReady.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rrReady.Code)
	}
}

func TestCheckUpdateEndpoint(t *testing.T) {
	releaseH := handlers.NewReleaseHandler(nil)

	req := httptest.NewRequest("GET", "/v1/app/update?version_code=10&channel=stable", nil)
	rr := httptest.NewRecorder()
	releaseH.CheckUpdate(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var res struct {
		HasUpdate   bool              `json:"has_update"`
		IsMandatory bool              `json:"is_mandatory"`
		Release     models.AppRelease `json:"release"`
	}
	if err := json.NewDecoder(rr.Body).Decode(&res); err != nil {
		t.Fatalf("failed decoding json: %v", err)
	}

	if !res.HasUpdate {
		t.Errorf("expected has_update=true when client version code is 10 and release is 13")
	}
	if res.Release.PackageName != "com.music.melo" {
		t.Errorf("expected package name com.music.melo, got %s", res.Release.PackageName)
	}
}

func TestAuthMiddlewareAndSyncPush(t *testing.T) {
	authService, _ := auth.NewService("test-project", "", "test")
	authMiddleware := middleware.NewAuthMiddleware(authService, nil)
	syncH := handlers.NewSyncHandler(nil)

	mutationID := uuid.New()
	entityID := uuid.New()
	reqBody := models.SyncPushRequest{
		Mutations: []models.SyncMutationInput{
			{
				ClientMutationID: mutationID,
				EntityType:       "track",
				EntityID:         entityID,
				Operation:        "insert",
				Payload:          json.RawMessage(`{"title":"Test Song"}`),
			},
		},
	}
	bodyBytes, _ := json.Marshal(reqBody)

	// 1. Without Token -> 401
	reqUnauth := httptest.NewRequest("POST", "/v1/sync/push", bytes.NewReader(bodyBytes))
	rrUnauth := httptest.NewRecorder()
	authMiddleware.RequireAuth(syncH.Push)(rrUnauth, reqUnauth)

	if rrUnauth.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized without token, got %d", rrUnauth.Code)
	}

	// 2. With Dev Bearer Token -> 200
	reqAuth := httptest.NewRequest("POST", "/v1/sync/push", bytes.NewReader(bodyBytes))
	reqAuth.Header.Set("Authorization", "Bearer dev-testuser-123")
	rrAuth := httptest.NewRecorder()
	authMiddleware.RequireAuth(syncH.Push)(rrAuth, reqAuth)

	if rrAuth.Code != http.StatusOK {
		t.Fatalf("expected 200 OK with valid dev token, got %d: %s", rrAuth.Code, rrAuth.Body.String())
	}

	var pushResp models.SyncPushResponse
	if err := json.NewDecoder(rrAuth.Body).Decode(&pushResp); err != nil {
		t.Fatalf("failed decoding sync response: %v", err)
	}

	if len(pushResp.AppliedMutationIDs) != 1 || pushResp.AppliedMutationIDs[0] != mutationID {
		t.Errorf("expected mutation %s to be acknowledged, got %v", mutationID, pushResp.AppliedMutationIDs)
	}
}

func TestUploadPresignValidation(t *testing.T) {
	authService, _ := auth.NewService("test-project", "", "test")
	authMiddleware := middleware.NewAuthMiddleware(authService, nil)
	cfg := config.Load()
	uploadH := handlers.NewUploadHandler(nil, cfg, nil)

	// Invalid content type -> 400
	badReq := handlers.PresignRequest{
		AssetType:   "avatar",
		ContentType: "application/pdf",
		ByteSize:    1024,
	}
	badBytes, _ := json.Marshal(badReq)
	req := httptest.NewRequest("POST", "/v1/uploads/presign", bytes.NewReader(badBytes))
	req.Header.Set("Authorization", "Bearer dev-uploader-1")
	rr := httptest.NewRecorder()
	authMiddleware.RequireAuth(uploadH.CreatePresignedURL)(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request for pdf content type, got %d", rr.Code)
	}

	// Valid image -> 200
	goodReq := handlers.PresignRequest{
		AssetType:   "avatar",
		ContentType: "image/png",
		ByteSize:    1024,
	}
	goodBytes, _ := json.Marshal(goodReq)
	req2 := httptest.NewRequest("POST", "/v1/uploads/presign", bytes.NewReader(goodBytes))
	req2.Header.Set("Authorization", "Bearer dev-uploader-1")
	rr2 := httptest.NewRecorder()
	authMiddleware.RequireAuth(uploadH.CreatePresignedURL)(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for image/png, got %d", rr2.Code)
	}
}
