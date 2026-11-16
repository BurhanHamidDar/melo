package config

import (
	"bufio"
	"bytes"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	AppEnv                 string
	Port                   string
	PublicAPIBaseURL       string
	LogLevel               string
	DatabaseURL            string
	DatabaseURLDirect      string
	FirebaseProjectID      string
	GoogleAppCredentials   string
	R2AccountID            string
	R2AccessKeyID          string
	R2SecretAccessKey      string
	R2ImagesBucket         string
	R2ReleasesBucket       string
	R2Endpoint             string
	R2PublicImageBaseURL   string
	R2PresignTTLSeconds    int
	AllowedAdminOrigins    string
	RateLimitEnabled       bool
}

func loadDotEnv() {
	paths := []string{".env", "../.env", "../../.env"}
	for _, p := range paths {
		data, err := os.ReadFile(p)
		if err == nil {
			scanner := bufio.NewScanner(bytes.NewReader(data))
			for scanner.Scan() {
				line := strings.TrimSpace(scanner.Text())
				if line == "" || strings.HasPrefix(line, "#") {
					continue
				}
				idx := strings.Index(line, "=")
				if idx > 0 {
					k := strings.TrimSpace(line[:idx])
					v := strings.TrimSpace(line[idx+1:])
					if len(v) >= 2 && ((v[0] == '"' && v[len(v)-1] == '"') || (v[0] == '\'' && v[len(v)-1] == '\'')) {
						v = v[1 : len(v)-1]
					}
					if _, exists := os.LookupEnv(k); !exists {
						os.Setenv(k, v)
					}
				}
			}
			break
		}
	}
}

func Load() *Config {
	loadDotEnv()

	port := getEnv("APP_PORT", "8080")
	presignTTL, _ := strconv.Atoi(getEnv("R2_PRESIGN_TTL_SECONDS", "300"))
	rateLimit, _ := strconv.ParseBool(getEnv("RATE_LIMIT_ENABLED", "true"))

	return &Config{
		AppEnv:               getEnv("APP_ENV", "development"),
		Port:                 port,
		PublicAPIBaseURL:     getEnv("PUBLIC_API_BASE_URL", "http://localhost:"+port),
		LogLevel:             getEnv("LOG_LEVEL", "debug"),
		DatabaseURL:          getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/melo?sslmode=disable"),
		DatabaseURLDirect:    getEnv("DATABASE_URL_DIRECT", ""),
		FirebaseProjectID:    getEnv("FIREBASE_PROJECT_ID", "melo-v2-dev"),
		GoogleAppCredentials: getEnv("GOOGLE_APPLICATION_CREDENTIALS", ""),
		R2AccountID:          getEnv("R2_ACCOUNT_ID", ""),
		R2AccessKeyID:        getEnv("R2_ACCESS_KEY_ID", ""),
		R2SecretAccessKey:    getEnv("R2_SECRET_ACCESS_KEY", ""),
		R2ImagesBucket:       getEnv("R2_IMAGES_BUCKET", "melo-images-dev"),
		R2ReleasesBucket:     getEnv("R2_RELEASES_BUCKET", "melo-releases-dev"),
		R2Endpoint:           getEnv("R2_ENDPOINT", ""),
		R2PublicImageBaseURL: getEnv("R2_PUBLIC_IMAGE_BASE_URL", "https://images.melo-app.com"),
		R2PresignTTLSeconds:  presignTTL,
		AllowedAdminOrigins:  getEnv("ALLOWED_ADMIN_ORIGINS", "http://localhost:3000"),
		RateLimitEnabled:     rateLimit,
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}
