package database_test

import (
	"context"
	"testing"
	"time"

	"github.com/melo-v2/backend/internal/config"
	"github.com/melo-v2/backend/internal/database"
)

func TestNeonConnectionAndTables(t *testing.T) {
	cfg := config.Load()
	if cfg.DatabaseURL == "" {
		t.Skip("skipping database test: DATABASE_URL not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		t.Fatalf("failed to connect to Neon database: %v", err)
	}
	defer db.Close()

	rows, err := db.Pool.Query(ctx, "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
	if err != nil {
		t.Fatalf("failed to query tables: %v", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			t.Fatalf("failed scanning table name: %v", err)
		}
		tables = append(tables, name)
	}

	t.Logf("Found %d tables in Neon DB: %v", len(tables), tables)
	if len(tables) == 0 {
		t.Errorf("expected tables in Neon database, found 0")
	}
}
