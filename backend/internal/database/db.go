package database

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	Pool *pgxpool.Pool
}

func Connect(ctx context.Context, connString string) (*DB, error) {
	if connString == "" {
		return nil, fmt.Errorf("database connection string is empty")
	}

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("failed to parse database config: %w", err)
	}

	config.MaxConns = 25
	config.MinConns = 2
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Verify connection (allow sufficient timeout for Neon serverless wakeups)
	pingCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	slog.Info("connected to Neon PostgreSQL successfully")
	return &DB{Pool: pool}, nil
}

func (db *DB) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

func (db *DB) RunMigrations(ctx context.Context, migrationsDir string) error {
	if db.Pool == nil {
		return fmt.Errorf("database pool is not initialized")
	}

	// Create schema_migrations table if not exists
	_, err := db.Pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`)
	if err != nil {
		return fmt.Errorf("failed creating schema_migrations table: %w", err)
	}

	// If users table already exists, mark 00001 as applied if not already marked
	var usersTableExists bool
	_ = db.Pool.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' AND table_name = 'users'
		);
	`).Scan(&usersTableExists)
	if usersTableExists {
		_, _ = db.Pool.Exec(ctx, `
			INSERT INTO schema_migrations (version) 
			VALUES ('00001_initial_schema.sql') 
			ON CONFLICT (version) DO NOTHING;
		`)
	}

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations dir: %w", err)
	}

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".sql") {
			continue
		}

		var count int
		err := db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM schema_migrations WHERE version = $1", file.Name()).Scan(&count)
		if err != nil {
			return fmt.Errorf("failed checking migration status for %s: %w", file.Name(), err)
		}
		if count > 0 {
			slog.Info("migration already applied, skipping", "file", file.Name())
			continue
		}

		path := filepath.Join(migrationsDir, file.Name())
		content, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", file.Name(), err)
		}

		slog.Info("applying migration", "file", file.Name())
		if _, err := db.Pool.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("failed executing migration %s: %w", file.Name(), err)
		}

		_, err = db.Pool.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", file.Name())
		if err != nil {
			return fmt.Errorf("failed recording migration %s: %w", file.Name(), err)
		}
	}

	slog.Info("all database migrations applied successfully")
	return nil
}
