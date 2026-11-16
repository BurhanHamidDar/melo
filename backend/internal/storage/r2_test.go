package storage_test

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/melo-v2/backend/internal/config"
	"github.com/melo-v2/backend/internal/storage"
)

func TestR2PresignPutURLAndUpload(t *testing.T) {
	cfg := config.Load()
	if cfg.R2AccessKeyID == "" || cfg.R2SecretAccessKey == "" {
		t.Skip("skipping R2 test: credentials not set")
	}

	client, err := storage.NewR2Client(cfg.R2AccountID, cfg.R2AccessKeyID, cfg.R2SecretAccessKey, cfg.R2Endpoint)
	if err != nil {
		t.Fatalf("failed to create R2 client: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	testKey := "test/hello-melo.txt"
	testContent := []byte("Hello Melo V2 Cloudflare R2 Storage!")

	presignedURL, err := client.PresignPutURL(ctx, cfg.R2ImagesBucket, testKey, "text/plain", 5*time.Minute)
	if err != nil {
		t.Fatalf("failed to generate presigned PUT url: %v", err)
	}

	t.Logf("Generated Presigned URL: %s", presignedURL)

	// Perform HTTP PUT with test content
	putReq, err := http.NewRequestWithContext(ctx, http.MethodPut, presignedURL, bytes.NewReader(testContent))
	if err != nil {
		t.Fatalf("failed creating PUT request: %v", err)
	}
	putReq.Header.Set("Content-Type", "text/plain")

	putResp, err := http.DefaultClient.Do(putReq)
	if err != nil {
		t.Fatalf("HTTP PUT to presigned URL failed: %v", err)
	}
	defer putResp.Body.Close()

	if putResp.StatusCode < 200 || putResp.StatusCode >= 300 {
		body, _ := io.ReadAll(putResp.Body)
		t.Fatalf("PUT failed with status %d: %s", putResp.StatusCode, string(body))
	}
	t.Logf("HTTP PUT successfully stored object in R2 (status %d)", putResp.StatusCode)

	// Verify reading from public URL
	publicURL := strings.TrimRight(cfg.R2PublicImageBaseURL, "/") + "/" + testKey
	getResp, err := http.Get(publicURL)
	if err != nil {
		t.Logf("Notice: Public URL GET check returned error (may take a moment to propagate): %v", err)
		return
	}
	defer getResp.Body.Close()

	if getResp.StatusCode == http.StatusOK {
		gotBytes, _ := io.ReadAll(getResp.Body)
		t.Logf("Verified object retrieved from public URL: %s", string(gotBytes))
	} else {
		t.Logf("Notice: Public URL returned HTTP %d (DNS/subdomain might take 1-2 mins to propagate)", getResp.StatusCode)
	}
}
