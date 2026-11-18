package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/melo-v2/backend/internal/auth"
	"github.com/melo-v2/backend/internal/config"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/http/handlers"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/notifications"
	"github.com/melo-v2/backend/internal/storage"
)

func main() {
	cfg := config.Load()

	// Initialize structured logger
	logHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	slog.SetDefault(slog.New(logHandler))
	slog.Info("starting Melo V2 API server", "env", cfg.AppEnv, "port", cfg.Port)

	// Connect to Neon PostgreSQL
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	db, err := database.Connect(ctx, cfg.DatabaseURL)
	cancel()
	if err != nil {
		slog.Warn("database connection failed (server will operate in mock/degraded mode)", "error", err)
	} else {
		defer db.Close()
	}

	// Initialize Firebase Auth service
	authService, err := auth.NewService(cfg.FirebaseProjectID, cfg.GoogleAppCredentials, cfg.AppEnv)
	if err != nil {
		slog.Error("failed to initialize auth service", "error", err)
		os.Exit(1)
	}

	// Middleware
	authMiddleware := middleware.NewAuthMiddleware(authService, db)

	// Storage
	r2Client, err := storage.NewR2Client(cfg.R2AccountID, cfg.R2AccessKeyID, cfg.R2SecretAccessKey, cfg.R2Endpoint)
	if err != nil {
		slog.Warn("failed to initialize R2 storage client", "error", err)
	}

	// Firebase Cloud Messaging
	fcmService, err := notifications.NewFCMService(cfg.GoogleAppCredentials, cfg.FirebaseProjectID)
	if err != nil {
		slog.Warn("FCM service initialization failed (push notifications will be disabled)", "error", err)
	} else {
		slog.Info("FCM service initialized successfully")
	}

	// Handlers
	healthH := handlers.NewHealthHandler(db)
	userH := handlers.NewUserHandler(db)
	syncH := handlers.NewSyncHandler(db)
	releaseH := handlers.NewReleaseHandler(db, cfg, r2Client)
	announcementH := handlers.NewAnnouncementHandler(db)
	uploadH := handlers.NewUploadHandler(db, cfg, r2Client)
	adminH := handlers.NewAdminHandler(db, fcmService, cfg, r2Client)
	playlistH := handlers.NewPlaylistHandler(db)
	communityH := handlers.NewCommunityHandler(db)
	shareH := handlers.NewShareHandler(db)

	// Routing with standard Go 1.22+ mux pattern matching
	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("GET /.well-known/assetlinks.json", shareH.AssetLinks)
	mux.HandleFunc("GET /track/{id}", shareH.TrackShare)
	mux.HandleFunc("GET /song/{id}", shareH.TrackShare)
	mux.HandleFunc("GET /playlist/{id}", shareH.PlaylistShare)
	mux.HandleFunc("GET /album/{id}", shareH.AlbumShare)
	mux.HandleFunc("GET /artist/{id}", shareH.ArtistShare)

	mux.HandleFunc("GET /v1/health", healthH.Health)
	mux.HandleFunc("GET /v1/ready", healthH.Ready)
	mux.HandleFunc("GET /v1/app/update", releaseH.CheckUpdate)
	mux.HandleFunc("GET /v1/releases/latest", releaseH.CheckUpdate)
	mux.HandleFunc("GET /api/v1/releases/latest", releaseH.CheckUpdate)
	mux.HandleFunc("GET /v1/landing/status", releaseH.LandingStatus)
	mux.HandleFunc("GET /v1/releases/download", releaseH.DownloadRelease)
	mux.HandleFunc("GET /v1/releases/files/{filename}", releaseH.ServeReleaseFile)
	mux.HandleFunc("GET /v1/announcements", announcementH.ListActive)
	mux.HandleFunc("POST /v1/me/username/check", userH.CheckUsername)

	// Authenticated User routes
	mux.HandleFunc("GET /v1/me", authMiddleware.RequireAuth(userH.GetMe))
	mux.HandleFunc("PATCH /v1/me", authMiddleware.RequireAuth(userH.UpdateMe))
	mux.HandleFunc("POST /v1/me/account-deletion", authMiddleware.RequireAuth(userH.RequestDeletion))
	mux.HandleFunc("GET /v1/me/export", authMiddleware.RequireAuth(userH.ExportData))
	mux.HandleFunc("POST /v1/me/devices", authMiddleware.RequireAuth(userH.RegisterDevice))
	mux.HandleFunc("DELETE /v1/me/devices/{install_id}", authMiddleware.RequireAuth(userH.UnregisterDevice))

	// Cloud Sync routes
	mux.HandleFunc("POST /v1/sync/push", authMiddleware.RequireAuth(syncH.Push))
	mux.HandleFunc("GET /v1/sync/pull", authMiddleware.RequireAuth(syncH.Pull))

	// Upload routes
	mux.HandleFunc("POST /v1/uploads/presign", authMiddleware.RequireAuth(uploadH.CreatePresignedURL))
	mux.HandleFunc("POST /v1/uploads/complete", authMiddleware.RequireAuth(uploadH.CompleteUpload))

	// Playlist routes
	mux.HandleFunc("POST /v1/playlists", authMiddleware.RequireAuth(playlistH.CreatePlaylist))
	mux.HandleFunc("GET /v1/playlists/{id}", playlistH.GetPlaylist)
	mux.HandleFunc("PATCH /v1/playlists/{id}", authMiddleware.RequireAuth(playlistH.UpdatePlaylist))
	mux.HandleFunc("DELETE /v1/playlists/{id}", authMiddleware.RequireAuth(playlistH.DeletePlaylist))
	mux.HandleFunc("POST /v1/playlists/{id}/tracks", authMiddleware.RequireAuth(playlistH.AddTrack))
	mux.HandleFunc("DELETE /v1/playlists/{id}/tracks/{trackId}", authMiddleware.RequireAuth(playlistH.RemoveTrack))
	mux.HandleFunc("PUT /v1/playlists/{id}/tracks/order", authMiddleware.RequireAuth(playlistH.ReorderTracks))
	mux.HandleFunc("POST /v1/playlists/{id}/follow", authMiddleware.RequireAuth(playlistH.FollowPlaylist))
	mux.HandleFunc("DELETE /v1/playlists/{id}/follow", authMiddleware.RequireAuth(playlistH.UnfollowPlaylist))
	mux.HandleFunc("GET /v1/playlists/{id}/members", authMiddleware.RequireAuth(playlistH.ListMembers))
	mux.HandleFunc("POST /v1/playlists/{id}/members", authMiddleware.RequireAuth(playlistH.AddMember))
	mux.HandleFunc("PATCH /v1/playlists/{id}/members/{userId}", authMiddleware.RequireAuth(playlistH.UpdateMember))
	mux.HandleFunc("DELETE /v1/playlists/{id}/members/{userId}", authMiddleware.RequireAuth(playlistH.RemoveMember))

	// Community routes
	mux.HandleFunc("GET /v1/community/playlists", communityH.BrowseCommunityPlaylists)
	mux.HandleFunc("GET /v1/community/profiles/{username}", communityH.GetPublicProfile)
	mux.HandleFunc("POST /v1/community/reports", authMiddleware.RequireAuth(communityH.CreateReport))
	mux.HandleFunc("POST /v1/reports", authMiddleware.RequireAuth(communityH.CreateReport))

	// Admin routes (RBAC protected)
	mux.HandleFunc("GET /v1/admin/overview", authMiddleware.RequireAdmin("moderator", adminH.Overview))
	mux.HandleFunc("GET /v1/admin/users", authMiddleware.RequireAdmin("moderator", adminH.ListUsers))
	mux.HandleFunc("PATCH /v1/admin/users/{id}/status", authMiddleware.RequireAdmin("moderator", adminH.UpdateUserStatus))
	mux.HandleFunc("GET /v1/admin/reports", authMiddleware.RequireAdmin("moderator", communityH.ListReports))
	mux.HandleFunc("PATCH /v1/admin/reports/{id}", authMiddleware.RequireAdmin("moderator", communityH.UpdateReport))
	mux.HandleFunc("POST /v1/admin/announcements", authMiddleware.RequireAdmin("content_manager", adminH.CreateAnnouncement))
	mux.HandleFunc("GET /v1/admin/releases", authMiddleware.RequireAdmin("content_manager", adminH.ListReleases))
	mux.HandleFunc("POST /v1/admin/releases", authMiddleware.RequireAdmin("content_manager", adminH.CreateRelease))
	mux.HandleFunc("POST /v1/admin/releases/upload", authMiddleware.RequireAdmin("content_manager", adminH.UploadReleaseAPK))
	mux.HandleFunc("POST /v1/admin/releases/{id}/unlock", authMiddleware.RequireAdmin("content_manager", adminH.QuickUnlockRelease))
	mux.HandleFunc("GET /v1/admin/landing/content", authMiddleware.RequireAdmin("content_manager", adminH.GetLandingContent))
	mux.HandleFunc("PUT /v1/admin/landing/content", authMiddleware.RequireAdmin("content_manager", adminH.UpdateLandingContent))
	mux.HandleFunc("POST /v1/admin/notifications/send", authMiddleware.RequireAdmin("content_manager", adminH.SendPushNotification))
	mux.HandleFunc("GET /v1/admin/audit-logs", authMiddleware.RequireAdmin("super_admin", adminH.ListAuditLogs))

	// Apply global middleware: CORS and Logging
	var handler http.Handler = mux
	handler = middleware.CORSMiddleware(cfg.AllowedAdminOrigins)(handler)
	handler = middleware.LoggingMiddleware(handler)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  5 * time.Minute,
		WriteTimeout: 5 * time.Minute,
		IdleTimeout:  5 * time.Minute,
	}

	// Server shutdown channel
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		slog.Info(fmt.Sprintf("Melo V2 API listening on http://localhost:%s", cfg.Port))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server listen failed", "error", err)
			os.Exit(1)
		}
	}()

	<-stopChan
	slog.Info("shutting down Melo V2 API server gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("graceful server shutdown failed", "error", err)
	}

	slog.Info("server exited cleanly")
}
