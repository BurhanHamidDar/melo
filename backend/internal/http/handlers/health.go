package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/melo-v2/backend/internal/database"
)

type HealthHandler struct {
	DB *database.DB
}

func NewHealthHandler(db *database.DB) *HealthHandler {
	return &HealthHandler{DB: db}
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"service": "melo-api",
		"version": "2.0.0",
	})
}

func (h *HealthHandler) Ready(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	dbStatus := "connected"
	if h.DB != nil && h.DB.Pool != nil {
		if err := h.DB.Pool.Ping(r.Context()); err != nil {
			dbStatus = "unreachable"
			w.WriteHeader(http.StatusServiceUnavailable)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"status":   "not_ready",
				"database": dbStatus,
			})
			return
		}
	} else {
		dbStatus = "mock_mode"
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "ready",
		"database": dbStatus,
	})
}
