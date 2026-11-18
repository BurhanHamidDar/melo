package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                uuid.UUID  `json:"id"`
	FirebaseUID       string     `json:"firebase_uid"`
	Email             *string    `json:"email,omitempty"`
	Username          *string    `json:"username,omitempty"`
	DisplayName       *string    `json:"display_name,omitempty"`
	Bio               *string    `json:"bio,omitempty"`
	AvatarAssetID     *uuid.UUID `json:"avatar_asset_id,omitempty"`
	AvatarURL         *string    `json:"avatar_url,omitempty"`
	ProfileVisibility string     `json:"profile_visibility"`
	AccountStatus     string     `json:"account_status"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	LastSeenAt        time.Time  `json:"last_seen_at"`
}

type UserProfileUpdate struct {
	DisplayName       *string `json:"display_name,omitempty"`
	Bio               *string `json:"bio,omitempty"`
	Username          *string `json:"username,omitempty"`
	ProfileVisibility *string `json:"profile_visibility,omitempty"`
}

type UserDevice struct {
	ID                   uuid.UUID `json:"id"`
	UserID               uuid.UUID `json:"user_id"`
	DeviceInstallID      uuid.UUID `json:"device_install_id"`
	Platform             string    `json:"platform"`
	AppVersionCode       *int64    `json:"app_version_code,omitempty"`
	AppVersionName       *string   `json:"app_version_name,omitempty"`
	DeviceLabel          *string   `json:"device_label,omitempty"`
	FCMToken             *string   `json:"fcm_token,omitempty"`
	NotificationsEnabled bool      `json:"notifications_enabled"`
	LastSeenAt           time.Time `json:"last_seen_at"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type MediaAsset struct {
	ID          uuid.UUID  `json:"id"`
	OwnerUserID *uuid.UUID `json:"owner_user_id,omitempty"`
	AssetType   string     `json:"asset_type"`
	BucketName  string     `json:"bucket_name"`
	ObjectKey   string     `json:"object_key"`
	Visibility  string     `json:"visibility"`
	ContentType string     `json:"content_type"`
	ByteSize    int64      `json:"byte_size"`
	Width       *int       `json:"width,omitempty"`
	Height      *int       `json:"height,omitempty"`
	SHA256      *string    `json:"sha256,omitempty"`
	Status      string     `json:"status"`
	URL         string     `json:"url,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type UserLibraryItem struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"user_id"`
	Provider         string    `json:"provider"`
	ProviderItemID   string    `json:"provider_item_id"`
	ItemType         string    `json:"item_type"` // track, album, artist, playlist
	Title            string    `json:"title"`
	ArtistName       *string   `json:"artist_name,omitempty"`
	AlbumTitle       *string   `json:"album_title,omitempty"`
	ArtworkSourceURL *string   `json:"artwork_source_url,omitempty"`
	IsLiked          bool      `json:"is_liked"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type Playlist struct {
	ID              uuid.UUID  `json:"id"`
	OwnerUserID     uuid.UUID  `json:"owner_user_id"`
	Title           string     `json:"title"`
	Description     *string    `json:"description,omitempty"`
	Visibility      string     `json:"visibility"` // private, unlisted, public
	CoverAssetID    *uuid.UUID `json:"cover_asset_id,omitempty"`
	CoverURL        *string    `json:"cover_url,omitempty"`
	IsCollaborative bool       `json:"is_collaborative"`
	Revision        int64      `json:"revision"`
	TracksCount     int        `json:"tracks_count,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type PlaylistTrack struct {
	ID               uuid.UUID  `json:"id"`
	PlaylistID       uuid.UUID  `json:"playlist_id"`
	Provider         string     `json:"provider"`
	ProviderItemID   string     `json:"provider_item_id"`
	Title            string     `json:"title"`
	ArtistName       *string    `json:"artist_name,omitempty"`
	AlbumTitle       *string    `json:"album_title,omitempty"`
	ArtworkSourceURL *string    `json:"artwork_source_url,omitempty"`
	PositionKey      string     `json:"position_key"`
	AddedBy          *uuid.UUID `json:"added_by,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type SyncMutation struct {
	ID               int64           `json:"id"`
	UserID           uuid.UUID       `json:"user_id"`
	ClientMutationID uuid.UUID       `json:"client_mutation_id"`
	EntityType       string          `json:"entity_type"`
	EntityID         uuid.UUID       `json:"entity_id"`
	Operation        string          `json:"operation"`
	Payload          json.RawMessage `json:"payload"`
	CreatedAt        time.Time       `json:"created_at"`
}

type SyncPushRequest struct {
	Mutations []SyncMutationInput `json:"mutations"`
}

type SyncMutationInput struct {
	ClientMutationID uuid.UUID       `json:"client_mutation_id"`
	EntityType       string          `json:"entity_type"`
	EntityID         uuid.UUID       `json:"entity_id"`
	Operation        string          `json:"operation"`
	Payload          json.RawMessage `json:"payload"`
}

type SyncPushResponse struct {
	AppliedMutationIDs []uuid.UUID `json:"applied_mutation_ids"`
	CurrentCursor      int64       `json:"current_cursor"`
}

type SyncPullResponse struct {
	Mutations []SyncMutation `json:"mutations"`
	NextCursor int64          `json:"next_cursor"`
	HasMore    bool           `json:"has_more"`
}

type Announcement struct {
	ID                   uuid.UUID  `json:"id"`
	Title                string     `json:"title"`
	Body                 string     `json:"body"`
	ImageAssetID         *uuid.UUID `json:"image_asset_id,omitempty"`
	ImageURL             *string    `json:"image_url,omitempty"`
	Severity             string     `json:"severity"` // info, important, critical
	TargetChannel        *string    `json:"target_channel,omitempty"`
	TargetMinVersionCode *int64     `json:"target_min_version_code,omitempty"`
	StartsAt             *time.Time `json:"starts_at,omitempty"`
	EndsAt               *time.Time `json:"ends_at,omitempty"`
	Status               string     `json:"status"` // draft, scheduled, published, archived
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type AppRelease struct {
	ID                     uuid.UUID  `json:"id"`
	Platform               string     `json:"platform"`
	Channel                string     `json:"channel"` // stable, beta
	VersionCode            int64      `json:"version_code"`
	VersionName            string     `json:"version_name"`
	MinSupportedVersionCode int64      `json:"min_supported_version_code"`
	PackageName            string     `json:"package_name"`
	DownloadURL            string     `json:"download_url"`
	SHA256                 string     `json:"sha256"`
	SigningCertSHA256      string     `json:"signing_cert_sha256"`
	FileSizeBytes          int64      `json:"file_size_bytes"`
	ReleaseNotes           string     `json:"release_notes"`
	RolloutPercentage      int        `json:"rollout_percentage"`
	Status                 string     `json:"status"` // draft, testing, published, paused, withdrawn
	Mandatory              bool       `json:"mandatory"`
	PublishedAt            *time.Time `json:"published_at,omitempty"`
	ScheduledReleaseAt     *time.Time `json:"scheduled_release_at,omitempty"`
	R2ObjectKey            *string    `json:"r2_object_key,omitempty"`
	IsLandingPrimary       bool       `json:"is_landing_primary"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}

type LandingContent struct {
	ID                 int             `json:"id"`
	IsActive           bool            `json:"is_active"`
	HeroHeadline       string          `json:"hero_headline"`
	HeroSubtext        string          `json:"hero_subtext"`
	AlertBannerEnabled bool            `json:"alert_banner_enabled"`
	AlertBannerText    *string         `json:"alert_banner_text,omitempty"`
	AlertBannerType    string          `json:"alert_banner_type"`
	AlertBannerLink    *string         `json:"alert_banner_link,omitempty"`
	Screenshots        json.RawMessage `json:"screenshots"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}

type FeatureFlag struct {
	Key            string          `json:"key"`
	Description    string          `json:"description"`
	Value          json.RawMessage `json:"value"`
	Enabled        bool            `json:"enabled"`
	MinVersionCode *int64          `json:"min_version_code,omitempty"`
	Channel        *string         `json:"channel,omitempty"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type Report struct {
	ID             uuid.UUID  `json:"id"`
	ReporterUserID *uuid.UUID `json:"reporter_user_id,omitempty"`
	TargetType     string     `json:"target_type"` // profile, playlist, announcement, other
	TargetID       *uuid.UUID `json:"target_id,omitempty"`
	Reason         string     `json:"reason"`
	Details        *string    `json:"details,omitempty"`
	Status         string     `json:"status"` // open, reviewing, resolved, dismissed
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type PlaylistMember struct {
	PlaylistID  uuid.UUID  `json:"playlist_id"`
	UserID      uuid.UUID  `json:"user_id"`
	Role        string     `json:"role"` // editor, viewer
	InvitedBy   *uuid.UUID `json:"invited_by,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Username    *string    `json:"username,omitempty"`
	DisplayName *string    `json:"display_name,omitempty"`
	AvatarURL   *string    `json:"avatar_url,omitempty"`
}

type PublicProfile struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username"`
	DisplayName *string   `json:"display_name,omitempty"`
	Bio         *string   `json:"bio,omitempty"`
	AvatarURL   *string   `json:"avatar_url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreatePlaylistRequest struct {
	Title           string  `json:"title"`
	Description     *string `json:"description,omitempty"`
	Visibility      string  `json:"visibility,omitempty"` // private, unlisted, public
	IsCollaborative bool    `json:"is_collaborative,omitempty"`
}

type UpdatePlaylistRequest struct {
	Title           *string `json:"title,omitempty"`
	Description     *string `json:"description,omitempty"`
	Visibility      *string `json:"visibility,omitempty"`
	IsCollaborative *bool   `json:"is_collaborative,omitempty"`
}

type AddPlaylistTrackRequest struct {
	Provider         string  `json:"provider"`
	ProviderItemID   string  `json:"provider_item_id"`
	Title            string  `json:"title"`
	ArtistName       *string `json:"artist_name,omitempty"`
	AlbumTitle       *string `json:"album_title,omitempty"`
	ArtworkSourceURL *string `json:"artwork_source_url,omitempty"`
	PositionKey      *string `json:"position_key,omitempty"`
}

type TrackOrder struct {
	TrackID     uuid.UUID `json:"track_id"`
	PositionKey string    `json:"position_key"`
}

type ReorderTracksRequest struct {
	TrackOrders []TrackOrder `json:"track_orders"`
}

type AddMemberRequest struct {
	UserID uuid.UUID `json:"user_id"`
	Role   string    `json:"role"` // editor, viewer
}

type UpdateMemberRequest struct {
	Role string `json:"role"`
}

type CreateReportRequest struct {
	TargetType string     `json:"target_type"` // profile, playlist, announcement, other
	TargetID   *uuid.UUID `json:"target_id,omitempty"`
	Reason     string     `json:"reason"`
	Details    *string    `json:"details,omitempty"`
}

type UpdateReportStatusRequest struct {
	Status         string  `json:"status"` // open, reviewing, resolved, dismissed
	ResolutionNote *string `json:"resolution_note,omitempty"`
}

type AdminRole struct {
	UserID    uuid.UUID `json:"user_id"`
	Role      string    `json:"role"` // super_admin, content_manager, moderator
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AdminAuditLog struct {
	ID          int64           `json:"id"`
	ActorUserID *uuid.UUID      `json:"actor_user_id,omitempty"`
	Action      string          `json:"action"`
	TargetType  *string         `json:"target_type,omitempty"`
	TargetID    *string         `json:"target_id,omitempty"`
	Reason      *string         `json:"reason,omitempty"`
	RequestID   *string         `json:"request_id,omitempty"`
	Metadata    json.RawMessage `json:"metadata"`
	CreatedAt   time.Time       `json:"created_at"`
}

type APIError struct {
	Code      string                 `json:"code"`
	Message   string                 `json:"message"`
	RequestID string                 `json:"request_id,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty"`
}

type ErrorResponse struct {
	Error APIError `json:"error"`
}
