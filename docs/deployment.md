# Melo V2 — Deployment & Infrastructure Guide

## 1. Go API Server Deployment

The Melo V2 API server is a stateless Go binary designed for containerized deployment (Docker, Kubernetes, AWS ECS, Google Cloud Run, Railway, or Fly.io).

### 1.1 Multi-Stage Dockerfile (`backend/Dockerfile`)
```dockerfile
# Build Stage
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o melo-api ./cmd/api

# Runtime Stage
FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
COPY --from=builder /app/melo-api .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/v1/health || exit 1
CMD ["./melo-api"]
```

### 1.2 Environment Variables Reference
| Variable | Description | Example |
|---|---|---|
| `PORT` | Listening TCP port | `8080` |
| `APP_ENV` | Runtime environment | `production` |
| `DATABASE_URL` | Neon PostgreSQL pooled connection string | `postgresql://user:pass@ep-...-pooler...neon.tech/neondb?sslmode=require` |
| `FIREBASE_PROJECT_ID` | Firebase project identifier | `melo-v2` |
| `R2_ACCOUNT_ID` | Cloudflare account identifier | `20f167e7a9aa9cf71e9e023dda92e377` |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API token ID | `ba81c4728d9a4a6a...` |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API token secret | `04e48360979c6dbd27c5...` |
| `R2_IMAGES_BUCKET` | Destination R2 bucket | `melo-images` |
| `R2_ENDPOINT` | R2 S3-compatible API endpoint | `https://20f167e7a9aa9cf71e9e023dda92e377.r2.cloudflarestorage.com` |
| `R2_PUBLIC_IMAGE_BASE_URL` | Public distribution CDN URL | `https://pub-65f5c567634e486682c0d063bc40dd16.r2.dev` |
| `ALLOWED_ADMIN_ORIGINS` | Permitted CORS origins for admin panel | `https://admin.melo.app,http://localhost:3000` |

---

## 2. Next.js 15 Web Admin Dashboard Deployment

The administrative console is built with Next.js 15 and React 19, deployable to Vercel or any containerized Node.js environment.

### 2.1 Build & Run
```bash
cd admin
npm install
npm run build
npm start
```

### 2.2 Client Environment Configuration (`admin/.env.local` or host secrets)
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyADln8-azOMmYAantGsjHPE0NWDcORn_H4"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="melo-v2.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="melo-v2"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="melo-v2.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="522961269977"
NEXT_PUBLIC_FIREBASE_APP_ID="1:522961269977:web:5f6235a592d8d15df4fac8"
NEXT_PUBLIC_API_URL="https://api.melo.app"
```

---

## 3. Cloudflare R2 CORS Configuration

To allow Android clients and Admin browsers to directly upload image assets via presigned PUT URLs, configure the following CORS rules on the `melo-images` bucket:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```
