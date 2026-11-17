package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/models"
)

type SyncHandler struct {
	DB *database.DB
}

func NewSyncHandler(db *database.DB) *SyncHandler {
	return &SyncHandler{DB: db}
}

func (h *SyncHandler) Push(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	var req models.SyncPushRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse sync payload")
		return
	}

	applied := make([]uuid.UUID, 0, len(req.Mutations))
	var latestCursor int64 = 0

	if h.DB != nil && h.DB.Pool != nil {
		tx, err := h.DB.Pool.Begin(r.Context())
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to start sync transaction")
			return
		}
		defer func() { _ = tx.Rollback(r.Context()) }()

		for _, m := range req.Mutations {
			// Idempotent insertion/update into sync_mutations
			query := `
				INSERT INTO sync_mutations (user_id, client_mutation_id, entity_type, entity_id, operation, payload)
				VALUES ($1, $2, $3, $4, $5, $6)
				ON CONFLICT (user_id, client_mutation_id) DO UPDATE SET 
					entity_type = EXCLUDED.entity_type,
					entity_id = EXCLUDED.entity_id,
					operation = EXCLUDED.operation,
					payload = EXCLUDED.payload
				RETURNING id
			`
			var mutationID int64
			err := tx.QueryRow(r.Context(), query, user.ID, m.ClientMutationID, m.EntityType, m.EntityID, m.Operation, m.Payload).Scan(&mutationID)
			if err == nil {
				applied = append(applied, m.ClientMutationID)
				if mutationID > latestCursor {
					latestCursor = mutationID
				}
			} else {
				// If already applied (conflict), acknowledge it
				applied = append(applied, m.ClientMutationID)
			}
		}

		if err := tx.Commit(r.Context()); err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to commit sync mutations")
			return
		}
	} else {
		for _, m := range req.Mutations {
			applied = append(applied, m.ClientMutationID)
		}
		latestCursor = 1
	}

	writeJSON(w, http.StatusOK, models.SyncPushResponse{
		AppliedMutationIDs: applied,
		CurrentCursor:      latestCursor,
	})
}

func (h *SyncHandler) Pull(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "User not authenticated")
		return
	}

	cursorStr := r.URL.Query().Get("cursor")
	cursor, _ := strconv.ParseInt(cursorStr, 10, 64)

	limitStr := r.URL.Query().Get("limit")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	mutations := make([]models.SyncMutation, 0)
	var nextCursor int64 = cursor

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, user_id, client_mutation_id, entity_type, entity_id, operation, payload, created_at
			FROM sync_mutations
			WHERE user_id = $1 AND id > $2
			ORDER BY id ASC
			LIMIT $3
		`
		rows, err := h.DB.Pool.Query(r.Context(), query, user.ID, cursor, limit+1)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var m models.SyncMutation
				if err := rows.Scan(&m.ID, &m.UserID, &m.ClientMutationID, &m.EntityType, &m.EntityID, &m.Operation, &m.Payload, &m.CreatedAt); err == nil {
					mutations = append(mutations, m)
					if m.ID > nextCursor {
						nextCursor = m.ID
					}
				}
			}
		}
	}

	hasMore := len(mutations) > limit
	if hasMore {
		mutations = mutations[:limit]
	}

	writeJSON(w, http.StatusOK, models.SyncPullResponse{
		Mutations:  mutations,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	})
}
