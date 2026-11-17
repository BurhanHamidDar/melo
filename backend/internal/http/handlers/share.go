package handlers

import (
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"time"

	"github.com/melo-v2/backend/internal/database"
)

type ShareHandler struct {
	DB         *database.DB
	httpClient *http.Client
}

func NewShareHandler(db *database.DB) *ShareHandler {
	return &ShareHandler{
		DB:         db,
		httpClient: &http.Client{Timeout: 4 * time.Second},
	}
}

type youtubeOEmbedResponse struct {
	Title        string `json:"title"`
	AuthorName   string `json:"author_name"`
	ThumbnailURL string `json:"thumbnail_url"`
}

type SharePageData struct {
	Type          string // "track", "playlist", "album", "artist"
	ID            string
	Title         string
	Subtitle      string
	ThumbnailURL  string
	MeloDeepLink  string
	AndroidIntent string
	FallbackURL   string
	DownloadURL   string
}

const landingPageTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ .Title }} • Melo Music</title>
    
    <!-- Open Graph / WhatsApp / Facebook / Discord -->
    <meta property="og:type" content="music.song">
    <meta property="og:site_name" content="Melo Music">
    <meta property="og:title" content="{{ .Title }}">
    <meta property="og:description" content="{{ .Subtitle }} • Listen on Melo Music">
    <meta property="og:image" content="{{ .ThumbnailURL }}">
    <meta property="og:image:width" content="640">
    <meta property="og:image:height" content="640">
    
    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ .Title }}">
    <meta name="twitter:description" content="{{ .Subtitle }} • Listen on Melo Music">
    <meta name="twitter:image" content="{{ .ThumbnailURL }}">

    <!-- App Links for Android -->
    <meta property="al:android:url" content="{{ .MeloDeepLink }}">
    <meta property="al:android:package" content="com.music.melo">
    <meta property="al:android:app_name" content="Melo">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background-color: #0b0c10;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-x: hidden;
            position: relative;
        }

        .ambient-glow {
            position: fixed;
            top: -20%;
            left: 50%;
            transform: translateX(-50%);
            width: 140vw;
            height: 140vw;
            max-width: 900px;
            max-height: 900px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(59, 130, 246, 0.08) 45%, rgba(0,0,0,0) 70%);
            filter: blur(60px);
            pointer-events: none;
            z-index: 0;
        }

        .container {
            width: 100%;
            max-width: 440px;
            padding: 28px 24px 36px;
            text-align: center;
            position: relative;
            z-index: 1;
        }

        .brand-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(12px);
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            color: #34d399;
            letter-spacing: 0.5px;
            margin-bottom: 24px;
        }

        .brand-badge .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 10px #10b981;
        }

        .artwork-card {
            position: relative;
            width: 250px;
            height: 250px;
            margin: 0 auto 28px;
            border-radius: 22px;
            overflow: hidden;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 45px rgba(16, 185, 129, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .artwork-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .song-title {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.3;
            margin-bottom: 8px;
            color: #ffffff;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .song-subtitle {
            font-size: 15px;
            font-weight: 500;
            color: #9ca3af;
            margin-bottom: 30px;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
        }

        .btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            padding: 15px 20px;
            border-radius: 16px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
            border: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
        }

        .btn-primary:active {
            transform: scale(0.98);
            filter: brightness(0.95);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.08);
            color: #f3f4f6;
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(10px);
        }

        .btn-secondary:active {
            background: rgba(255, 255, 255, 0.14);
            transform: scale(0.98);
        }

        .btn-download {
            background: transparent;
            color: #9ca3af;
            font-size: 13px;
            padding: 10px;
            margin-top: 6px;
        }

        .btn-download:hover {
            color: #e5e7eb;
        }

        .footer-note {
            margin-top: 28px;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="ambient-glow"></div>
    <div class="container">
        <div class="brand-badge">
            <span class="dot"></span>
            <span>Shared via Melo Music</span>
        </div>

        <div class="artwork-card">
            <img src="{{ .ThumbnailURL }}" alt="{{ .Title }}" onerror="this.src='https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop'">
        </div>

        <h1 class="song-title">{{ .Title }}</h1>
        <p class="song-subtitle">{{ .Subtitle }}</p>

        <div class="actions">
            <a id="openInMeloBtn" href="{{ .AndroidIntent }}" class="btn btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Play in Melo</span>
            </a>

            <a href="{{ .FallbackURL }}" class="btn btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <span>Listen on YouTube Music</span>
            </a>

            <a href="{{ .DownloadURL }}" class="btn btn-download">
                Don't have Melo? Download APK
            </a>
        </div>

        <div class="footer-note">
            Free & Open Source Music Streaming
        </div>
    </div>

    <script>
        // Automatic app launch attempt on Android devices
        (function() {
            var intentUrl = {{ .AndroidIntent }};
            var deepLinkUrl = {{ .MeloDeepLink }};
            var isAndroid = /Android/i.test(navigator.userAgent);
            
            if (isAndroid) {
                // If user tapped directly from WhatsApp or a mobile browser, attempt to invoke app
                setTimeout(function() {
                    window.location.href = intentUrl;
                }, 150);
            }
        })();
    </script>
</body>
</html>`

func (h *ShareHandler) AssetLinks(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	jsonStr := `[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "com.music.melo",
      "sha256_cert_fingerprints": [
        "50:EB:90:BA:D2:41:8D:45:8D:57:52:E7:00:81:36:58:97:44:01:B8:05:16:35:DD:A2:14:B5:9A:56:A0:C4:FB"
      ]
    }
  }
]`
	w.Write([]byte(jsonStr))
}

func (h *ShareHandler) TrackShare(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		http.Error(w, "Track ID required", http.StatusBadRequest)
		return
	}

	title := "Track on Melo"
	artist := "Melo Music"
	thumbnail := fmt.Sprintf("https://i.ytimg.com/vi/%s/hqdefault.jpg", id)

	// Fetch oEmbed metadata from YouTube
	oembedURL := fmt.Sprintf("https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=%s&format=json", id)
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, oembedURL, nil)
	if err == nil {
		req.Header.Set("User-Agent", "MeloMusicServer/1.0")
		resp, err := h.httpClient.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			var oembed youtubeOEmbedResponse
			if err := json.NewDecoder(resp.Body).Decode(&oembed); err == nil {
				if oembed.Title != "" {
					title = oembed.Title
				}
				if oembed.AuthorName != "" {
					artist = oembed.AuthorName
				}
				if oembed.ThumbnailURL != "" {
					thumbnail = oembed.ThumbnailURL
				}
			}
		}
	}

	data := SharePageData{
		Type:          "track",
		ID:            id,
		Title:         title,
		Subtitle:      artist,
		ThumbnailURL:  thumbnail,
		MeloDeepLink:  fmt.Sprintf("melo://track/%s", id),
		AndroidIntent: fmt.Sprintf("intent://track/%s#Intent;scheme=melo;package=com.music.melo;end", id),
		FallbackURL:   fmt.Sprintf("https://music.youtube.com/watch?v=%s", id),
		DownloadURL:   "https://github.com/BurhanHamidDar/melo/releases",
	}

	renderLandingPage(w, data)
}

func (h *ShareHandler) PlaylistShare(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		http.Error(w, "Playlist ID required", http.StatusBadRequest)
		return
	}

	title := "Playlist on Melo"
	subtitle := "Curated Playlist"
	thumbnail := "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop"

	// If it's a synced / local playlist stored in PostgreSQL
	if strings.HasPrefix(id, "LP") && h.DB != nil && h.DB.Pool != nil {
		var plTitle, plDesc, plThumb string
		err := h.DB.Pool.QueryRow(r.Context(),
			"SELECT payload->>'name', COALESCE(payload->>'description', ''), COALESCE(payload->'tracks'->0->>'thumbnail_url', '') FROM sync_mutations WHERE entity_type='playlist' AND (entity_id::text=$1 OR payload->>'playlist_id'=$1) ORDER BY id DESC LIMIT 1",
			id,
		).Scan(&plTitle, &plDesc, &plThumb)
		if err == nil && plTitle != "" {
			title = plTitle
			if plDesc != "" {
				subtitle = plDesc
			}
			if plThumb != "" && !strings.HasPrefix(plThumb, "file://") {
				thumbnail = plThumb
			}
		}
	}

	fallbackURL := fmt.Sprintf("https://music.youtube.com/playlist?list=%s", id)
	if strings.HasPrefix(id, "LP") {
		fallbackURL = "https://github.com/BurhanHamidDar/melo/releases"
	}

	data := SharePageData{
		Type:          "playlist",
		ID:            id,
		Title:         title,
		Subtitle:      subtitle,
		ThumbnailURL:  thumbnail,
		MeloDeepLink:  fmt.Sprintf("melo://playlist/%s", id),
		AndroidIntent: fmt.Sprintf("intent://playlist/%s#Intent;scheme=melo;package=com.music.melo;end", id),
		FallbackURL:   fallbackURL,
		DownloadURL:   "https://github.com/BurhanHamidDar/melo/releases",
	}

	renderLandingPage(w, data)
}

func (h *ShareHandler) AlbumShare(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		http.Error(w, "Album ID required", http.StatusBadRequest)
		return
	}

	data := SharePageData{
		Type:          "album",
		ID:            id,
		Title:         "Album on Melo",
		Subtitle:      "Listen in high quality on Melo",
		ThumbnailURL:  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop",
		MeloDeepLink:  fmt.Sprintf("melo://album/%s", id),
		AndroidIntent: fmt.Sprintf("intent://album/%s#Intent;scheme=melo;package=com.music.melo;end", id),
		FallbackURL:   fmt.Sprintf("https://music.youtube.com/playlist?list=%s", id),
		DownloadURL:   "https://github.com/BurhanHamidDar/melo/releases",
	}

	renderLandingPage(w, data)
}

func (h *ShareHandler) ArtistShare(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.PathValue("id"))
	if id == "" {
		http.Error(w, "Artist ID required", http.StatusBadRequest)
		return
	}

	data := SharePageData{
		Type:          "artist",
		ID:            id,
		Title:         "Artist on Melo",
		Subtitle:      "Explore discography on Melo",
		ThumbnailURL:  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop",
		MeloDeepLink:  fmt.Sprintf("melo://artist/%s", id),
		AndroidIntent: fmt.Sprintf("intent://artist/%s#Intent;scheme=melo;package=com.music.melo;end", id),
		FallbackURL:   fmt.Sprintf("https://music.youtube.com/channel/%s", id),
		DownloadURL:   "https://github.com/BurhanHamidDar/melo/releases",
	}

	renderLandingPage(w, data)
}

func renderLandingPage(w http.ResponseWriter, data SharePageData) {
	tmpl, err := template.New("share").Parse(landingPageTemplate)
	if err != nil {
		http.Error(w, "Failed to render template", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	if err := tmpl.Execute(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
