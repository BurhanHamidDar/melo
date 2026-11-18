#!/usr/bin/env bash
set -e

echo "=== Building Melo Go Backend for Linux ==="
CGO_ENABLED=0 go build -ldflags="-s -w" -o api ./cmd/api
chmod +x api
echo "=== Build successful! Binary ready at ./api ==="
