package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/melo-v2/backend/internal/config"
	"github.com/melo-v2/backend/internal/database"
)

func main() {
	cfg := config.Load()

	// Use direct URL for migrations if available, else pooled URL
	connStr := cfg.DatabaseURLDirect
	if connStr == "" {
		connStr = cfg.DatabaseURL
	}

	slog.Info("connecting to Neon database for migration...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	db, err := database.Connect(ctx, connStr)
	if err != nil {
		slog.Error("failed to connect to Neon database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	slog.Info("applying migrations from backend/migrations...")
	if err := db.RunMigrations(ctx, "migrations"); err != nil {
		slog.Error("migration failed", "error", err)
		os.Exit(1)
	}

	fmt.Println("SUCCESS: Neon database schema applied successfully!")
}
