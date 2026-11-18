package middleware

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}

		w.Header().Set("X-Request-ID", requestID)

		wrapped := &responseWriterWrapper{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)
		slog.Info("http request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", wrapped.statusCode,
			"duration_ms", duration.Milliseconds(),
			"request_id", requestID,
			"remote_addr", r.RemoteAddr,
		)
	})
}

func CORSMiddleware(allowedOrigins string) func(http.Handler) http.Handler {
	originsList := make(map[string]bool)
	for _, o := range strings.Split(allowedOrigins, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			originsList[o] = true
		}
	}
	// Always allow local dev landing and admin origins in development, plus production subdomains
	originsList["http://localhost:3000"] = true
	originsList["http://localhost:8000"] = true
	originsList["http://127.0.0.1:3000"] = true
	originsList["http://127.0.0.1:8000"] = true
	originsList["https://admin.burhanhamid.in"] = true
	originsList["https://melo.burhanhamid.in"] = true
	originsList["http://admin.burhanhamid.in"] = true
	originsList["http://melo.burhanhamid.in"] = true
	originsList["https://admin.applicoda.in"] = true
	originsList["https://melo.applicoda.in"] = true
	originsList["http://admin.applicoda.in"] = true
	originsList["http://melo.applicoda.in"] = true

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" {
				isPublicEndpoint := strings.HasPrefix(r.URL.Path, "/v1/landing/") ||
					strings.HasPrefix(r.URL.Path, "/v1/releases/") ||
					strings.HasPrefix(r.URL.Path, "/v1/app/") ||
					strings.HasPrefix(r.URL.Path, "/.well-known/")

				if isPublicEndpoint {
					w.Header().Set("Access-Control-Allow-Origin", "*")
				} else if originsList[origin] || originsList["*"] {
					w.Header().Set("Access-Control-Allow-Origin", origin)
				} else {
					w.Header().Set("Access-Control-Allow-Origin", allowedOrigins)
				}

				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID")
				w.Header().Set("Access-Control-Max-Age", "86400")
			}

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

type responseWriterWrapper struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriterWrapper) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
