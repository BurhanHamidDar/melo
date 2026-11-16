package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/melo-v2/backend/internal/database"
	"github.com/melo-v2/backend/internal/http/middleware"
	"github.com/melo-v2/backend/internal/models"
)

type PlaylistHandler struct {
	DB *database.DB
}

func NewPlaylistHandler(db *database.DB) *PlaylistHandler {
	return &PlaylistHandler{DB: db}
}

func (h *PlaylistHandler) hasEditPermission(ctx context.Context, playlistID, userID uuid.UUID) (bool, error) {
	if h.DB == nil || h.DB.Pool == nil {
		return false, nil
	}
	var ownerID uuid.UUID
	var isCollaborative bool
	err := h.DB.Pool.QueryRow(ctx, "SELECT owner_user_id, is_collaborative FROM playlists WHERE id = $1 AND deleted_at IS NULL", playlistID).Scan(&ownerID, &isCollaborative)
	if err != nil {
		return false, err
	}
	if ownerID == userID {
		return true, nil
	}
	if !isCollaborative {
		return false, nil
	}
	var role string
	err = h.DB.Pool.QueryRow(ctx, "SELECT role FROM playlist_members WHERE playlist_id = $1 AND user_id = $2", playlistID, userID).Scan(&role)
	if err == nil && role == "editor" {
		return true, nil
	}
	return false, nil
}

func (h *PlaylistHandler) CreatePlaylist(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	var req models.CreatePlaylistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse playlist payload")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "Playlist title cannot be empty")
		return
	}

	visibility := req.Visibility
	if visibility == "" {
		visibility = "private"
	}
	if visibility != "private" && visibility != "unlisted" && visibility != "public" {
		writeError(w, http.StatusBadRequest, "INVALID_VISIBILITY", "Visibility must be private, unlisted, or public")
		return
	}

	p := models.Playlist{
		ID:              uuid.New(),
		OwnerUserID:     user.ID,
		Title:           req.Title,
		Description:     req.Description,
		Visibility:      visibility,
		IsCollaborative: req.IsCollaborative,
		Revision:        1,
		CreatedAt:       time.Now().UTC(),
		UpdatedAt:       time.Now().UTC(),
	}

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			INSERT INTO playlists (id, owner_user_id, title, description, visibility, is_collaborative, revision, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`
		_, err := h.DB.Pool.Exec(r.Context(), query, p.ID, p.OwnerUserID, p.Title, p.Description, p.Visibility, p.IsCollaborative, p.Revision, p.CreatedAt, p.UpdatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create playlist: "+err.Error())
			return
		}
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"playlist": p,
	})
}

func (h *PlaylistHandler) GetPlaylist(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	playlistID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	user := middleware.GetUserFromContext(r.Context())

	var p models.Playlist
	var ownerID uuid.UUID
	var visibility string
	var isCollaborative bool

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT id, owner_user_id, title, description, visibility, cover_asset_id, is_collaborative, revision, created_at, updated_at
			FROM playlists
			WHERE id = $1 AND deleted_at IS NULL
		`
		err := h.DB.Pool.QueryRow(r.Context(), query, playlistID).Scan(
			&p.ID, &p.OwnerUserID, &p.Title, &p.Description, &p.Visibility, &p.CoverAssetID, &p.IsCollaborative, &p.Revision, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "Playlist not found")
			return
		}
		ownerID = p.OwnerUserID
		visibility = p.Visibility
		isCollaborative = p.IsCollaborative
	} else {
		writeError(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Database unavailable")
		return
	}

	// Permission check: if private, only owner or member can view
	if visibility == "private" {
		if user == nil {
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required for private playlist")
			return
		}
		if user.ID != ownerID {
			var memberRole string
			err := h.DB.Pool.QueryRow(r.Context(), "SELECT role FROM playlist_members WHERE playlist_id = $1 AND user_id = $2", playlistID, user.ID).Scan(&memberRole)
			if err != nil {
				writeError(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to view this private playlist")
				return
			}
		}
	}

	// Fetch tracks
	tracks := make([]models.PlaylistTrack, 0)
	trackRows, err := h.DB.Pool.Query(r.Context(), `
		SELECT id, playlist_id, provider, provider_item_id, title, artist_name, album_title, artwork_source_url, position_key, added_by, created_at, updated_at
		FROM playlist_tracks
		WHERE playlist_id = $1
		ORDER BY position_key ASC
	`, playlistID)
	if err == nil {
		defer trackRows.Close()
		for trackRows.Next() {
			var t models.PlaylistTrack
			if err := trackRows.Scan(&t.ID, &t.PlaylistID, &t.Provider, &t.ProviderItemID, &t.Title, &t.ArtistName, &t.AlbumTitle, &t.ArtworkSourceURL, &t.PositionKey, &t.AddedBy, &t.CreatedAt, &t.UpdatedAt); err == nil {
				tracks = append(tracks, t)
			}
		}
	}
	p.TracksCount = len(tracks)

	// Can user edit?
	canEdit := false
	if user != nil {
		if user.ID == ownerID {
			canEdit = true
		} else if isCollaborative {
			allowed, _ := h.hasEditPermission(r.Context(), playlistID, user.ID)
			canEdit = allowed
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"playlist": p,
		"tracks":   tracks,
		"can_edit": canEdit,
	})
}

func (h *PlaylistHandler) UpdatePlaylist(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	idStr := r.PathValue("id")
	playlistID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	canEdit, err := h.hasEditPermission(r.Context(), playlistID, user.ID)
	if err != nil || !canEdit {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to edit this playlist")
		return
	}

	var req models.UpdatePlaylistRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse update payload")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		if req.Title != nil {
			_, _ = h.DB.Pool.Exec(r.Context(), "UPDATE playlists SET title = $1, revision = revision + 1, updated_at = NOW() WHERE id = $2", *req.Title, playlistID)
		}
		if req.Description != nil {
			_, _ = h.DB.Pool.Exec(r.Context(), "UPDATE playlists SET description = $1, revision = revision + 1, updated_at = NOW() WHERE id = $2", *req.Description, playlistID)
		}
		if req.Visibility != nil {
			if *req.Visibility == "private" || *req.Visibility == "unlisted" || *req.Visibility == "public" {
				_, _ = h.DB.Pool.Exec(r.Context(), "UPDATE playlists SET visibility = $1, revision = revision + 1, updated_at = NOW() WHERE id = $2", *req.Visibility, playlistID)
			}
		}
		if req.IsCollaborative != nil {
			_, _ = h.DB.Pool.Exec(r.Context(), "UPDATE playlists SET is_collaborative = $1, revision = revision + 1, updated_at = NOW() WHERE id = $2", *req.IsCollaborative, playlistID)
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Playlist updated successfully",
	})
}

func (h *PlaylistHandler) DeletePlaylist(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	idStr := r.PathValue("id")
	playlistID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		res, err := h.DB.Pool.Exec(r.Context(), "UPDATE playlists SET deleted_at = NOW() WHERE id = $1 AND owner_user_id = $2 AND deleted_at IS NULL", playlistID, user.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete playlist")
			return
		}
		if res.RowsAffected() == 0 {
			writeError(w, http.StatusForbidden, "FORBIDDEN", "Only the owner can delete this playlist")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Playlist deleted successfully",
	})
}

func (h *PlaylistHandler) AddTrack(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	idStr := r.PathValue("id")
	playlistID, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	canEdit, err := h.hasEditPermission(r.Context(), playlistID, user.ID)
	if err != nil || !canEdit {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to add tracks to this playlist")
		return
	}

	var req models.AddPlaylistTrackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse track payload")
		return
	}

	if req.ProviderItemID == "" || req.Title == "" {
		writeError(w, http.StatusBadRequest, "VALIDATION_ERROR", "ProviderItemID and Title are required")
		return
	}
	provider := req.Provider
	if provider == "" {
		provider = "youtube"
	}

	positionKey := fmt.Sprintf("%012d", time.Now().UnixMilli())
	if req.PositionKey != nil && *req.PositionKey != "" {
		positionKey = *req.PositionKey
	}

	track := models.PlaylistTrack{
		ID:               uuid.New(),
		PlaylistID:       playlistID,
		Provider:         provider,
		ProviderItemID:   req.ProviderItemID,
		Title:            req.Title,
		ArtistName:       req.ArtistName,
		AlbumTitle:       req.AlbumTitle,
		ArtworkSourceURL: req.ArtworkSourceURL,
		PositionKey:      positionKey,
		AddedBy:          &user.ID,
		CreatedAt:        time.Now().UTC(),
		UpdatedAt:        time.Now().UTC(),
	}

	if h.DB != nil && h.DB.Pool != nil {
		query := `
			INSERT INTO playlist_tracks (id, playlist_id, provider, provider_item_id, title, artist_name, album_title, artwork_source_url, position_key, added_by, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			ON CONFLICT (playlist_id, provider, provider_item_id) DO NOTHING
		`
		_, err := h.DB.Pool.Exec(r.Context(), query, track.ID, track.PlaylistID, track.Provider, track.ProviderItemID, track.Title, track.ArtistName, track.AlbumTitle, track.ArtworkSourceURL, track.PositionKey, track.AddedBy, track.CreatedAt, track.UpdatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to insert track: "+err.Error())
			return
		}
		_, _ = h.DB.Pool.Exec(r.Context(), "UPDATE playlists SET revision = revision + 1, updated_at = NOW() WHERE id = $1", playlistID)
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"track": track,
	})
}

func (h *PlaylistHandler) RemoveTrack(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	playlistID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	trackID, err := uuid.Parse(r.PathValue("trackId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid track UUID")
		return
	}

	canEdit, err := h.hasEditPermission(r.Context(), playlistID, user.ID)
	if err != nil || !canEdit {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to remove tracks from this playlist")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		_, err := h.DB.Pool.Exec(r.Context(), "DELETE FROM playlist_tracks WHERE playlist_id = $1 AND id = $2", playlistID, trackID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to remove track")
			return
		}
		_, _ = h.DB.Pool.Exec(r.Context(), "UPDATE playlists SET revision = revision + 1, updated_at = NOW() WHERE id = $1", playlistID)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Track removed successfully",
	})
}

func (h *PlaylistHandler) ReorderTracks(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	playlistID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	canEdit, err := h.hasEditPermission(r.Context(), playlistID, user.ID)
	if err != nil || !canEdit {
		writeError(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to reorder tracks")
		return
	}

	var req models.ReorderTracksRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse reorder payload")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		tx, err := h.DB.Pool.Begin(r.Context())
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Transaction failed")
			return
		}
		defer tx.Rollback(r.Context())

		for _, item := range req.TrackOrders {
			_, err := tx.Exec(r.Context(), "UPDATE playlist_tracks SET position_key = $1, updated_at = NOW() WHERE playlist_id = $2 AND id = $3", item.PositionKey, playlistID, item.TrackID)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update track order: "+err.Error())
				return
			}
		}
		_, _ = tx.Exec(r.Context(), "UPDATE playlists SET revision = revision + 1, updated_at = NOW() WHERE id = $1", playlistID)

		if err := tx.Commit(r.Context()); err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to commit track reorder")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Tracks reordered successfully",
	})
}

func (h *PlaylistHandler) FollowPlaylist(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	playlistID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		var visibility string
		err := h.DB.Pool.QueryRow(r.Context(), "SELECT visibility FROM playlists WHERE id = $1 AND deleted_at IS NULL", playlistID).Scan(&visibility)
		if err != nil {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "Playlist not found")
			return
		}
		if visibility == "private" {
			writeError(w, http.StatusForbidden, "FORBIDDEN", "Cannot follow a private playlist")
			return
		}

		query := `INSERT INTO playlist_follows (user_id, playlist_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
		_, err = h.DB.Pool.Exec(r.Context(), query, user.ID, playlistID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to follow playlist")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Playlist followed successfully",
	})
}

func (h *PlaylistHandler) UnfollowPlaylist(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	playlistID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		_, err := h.DB.Pool.Exec(r.Context(), "DELETE FROM playlist_follows WHERE user_id = $1 AND playlist_id = $2", user.ID, playlistID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to unfollow playlist")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Playlist unfollowed successfully",
	})
}

func (h *PlaylistHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	playlistID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	members := make([]models.PlaylistMember, 0)
	if h.DB != nil && h.DB.Pool != nil {
		query := `
			SELECT pm.playlist_id, pm.user_id, pm.role, pm.invited_by, pm.created_at, pm.updated_at,
			       u.username, u.display_name
			FROM playlist_members pm
			LEFT JOIN users u ON pm.user_id = u.id
			WHERE pm.playlist_id = $1
			ORDER BY pm.created_at ASC
		`
		rows, err := h.DB.Pool.Query(r.Context(), query, playlistID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var m models.PlaylistMember
				if err := rows.Scan(&m.PlaylistID, &m.UserID, &m.Role, &m.InvitedBy, &m.CreatedAt, &m.UpdatedAt, &m.Username, &m.DisplayName); err == nil {
					members = append(members, m)
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"members": members,
	})
}

func (h *PlaylistHandler) AddMember(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	playlistID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	var req models.AddMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse member payload")
		return
	}

	if req.Role != "editor" && req.Role != "viewer" {
		req.Role = "viewer"
	}

	if h.DB != nil && h.DB.Pool != nil {
		var ownerID uuid.UUID
		err := h.DB.Pool.QueryRow(r.Context(), "SELECT owner_user_id FROM playlists WHERE id = $1 AND deleted_at IS NULL", playlistID).Scan(&ownerID)
		if err != nil || ownerID != user.ID {
			writeError(w, http.StatusForbidden, "FORBIDDEN", "Only playlist owner can manage members")
			return
		}

		query := `
			INSERT INTO playlist_members (playlist_id, user_id, role, invited_by, created_at, updated_at)
			VALUES ($1, $2, $3, $4, NOW(), NOW())
			ON CONFLICT (playlist_id, user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()
		`
		_, err = h.DB.Pool.Exec(r.Context(), query, playlistID, req.UserID, req.Role, user.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to add member: "+err.Error())
			return
		}
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Collaborator added successfully",
	})
}

func (h *PlaylistHandler) UpdateMember(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	playlistID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	targetUserID, err := uuid.Parse(r.PathValue("userId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid member UUID")
		return
	}

	var req models.UpdateMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Failed to parse payload")
		return
	}
	if req.Role != "editor" && req.Role != "viewer" {
		writeError(w, http.StatusBadRequest, "INVALID_ROLE", "Role must be editor or viewer")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		var ownerID uuid.UUID
		err := h.DB.Pool.QueryRow(r.Context(), "SELECT owner_user_id FROM playlists WHERE id = $1 AND deleted_at IS NULL", playlistID).Scan(&ownerID)
		if err != nil || ownerID != user.ID {
			writeError(w, http.StatusForbidden, "FORBIDDEN", "Only playlist owner can modify member roles")
			return
		}

		_, err = h.DB.Pool.Exec(r.Context(), "UPDATE playlist_members SET role = $1, updated_at = NOW() WHERE playlist_id = $2 AND user_id = $3", req.Role, playlistID, targetUserID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update member role")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Member role updated successfully",
	})
}

func (h *PlaylistHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	user := middleware.GetUserFromContext(r.Context())
	if user == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authentication required")
		return
	}

	playlistID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid playlist UUID")
		return
	}

	targetUserID, err := uuid.Parse(r.PathValue("userId"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid member UUID")
		return
	}

	if h.DB != nil && h.DB.Pool != nil {
		var ownerID uuid.UUID
		err := h.DB.Pool.QueryRow(r.Context(), "SELECT owner_user_id FROM playlists WHERE id = $1 AND deleted_at IS NULL", playlistID).Scan(&ownerID)
		if err != nil {
			writeError(w, http.StatusNotFound, "NOT_FOUND", "Playlist not found")
			return
		}
		// Can be removed by owner or target user leaving themselves
		if ownerID != user.ID && targetUserID != user.ID {
			writeError(w, http.StatusForbidden, "FORBIDDEN", "Only playlist owner or member themselves can remove membership")
			return
		}

		_, err = h.DB.Pool.Exec(r.Context(), "DELETE FROM playlist_members WHERE playlist_id = $1 AND user_id = $2", playlistID, targetUserID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to remove member")
			return
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Member removed successfully",
	})
}
