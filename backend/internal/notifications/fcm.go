package notifications

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type ServiceAccount struct {
	Type         string `json:"type"`
	ProjectID    string `json:"project_id"`
	PrivateKeyID string `json:"private_key_id"`
	PrivateKey   string `json:"private_key"`
	ClientEmail  string `json:"client_email"`
	TokenURI     string `json:"token_uri"`
}

type FCMService struct {
	projectID   string
	clientEmail string
	privateKey  *rsa.PrivateKey
	tokenURI    string

	mu          sync.Mutex
	accessToken string
	expiresAt   time.Time
	httpClient  *http.Client
}

func NewFCMService(credentialsPath, fallbackProjectID string) (*FCMService, error) {
	resolvedPath := credentialsPath
	if _, err := os.Stat(resolvedPath); os.IsNotExist(err) {
		alt := filepath.Join("backend", credentialsPath)
		if _, err := os.Stat(alt); err == nil {
			resolvedPath = alt
		}
	}

	data, err := os.ReadFile(resolvedPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read firebase credentials at %s: %w", resolvedPath, err)
	}

	var sa ServiceAccount
	if err := json.Unmarshal(data, &sa); err != nil {
		return nil, fmt.Errorf("failed to parse service account JSON: %w", err)
	}

	block, _ := pem.Decode([]byte(sa.PrivateKey))
	if block == nil {
		return nil, fmt.Errorf("failed to decode private key PEM")
	}

	privKeyInterface, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse PKCS8 private key: %w", err)
	}

	rsaKey, ok := privKeyInterface.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("private key is not an RSA private key")
	}

	projID := sa.ProjectID
	if projID == "" {
		projID = fallbackProjectID
	}

	tokenURI := sa.TokenURI
	if tokenURI == "" {
		tokenURI = "https://oauth2.googleapis.com/token"
	}

	return &FCMService{
		projectID:   projID,
		clientEmail: sa.ClientEmail,
		privateKey:  rsaKey,
		tokenURI:    tokenURI,
		httpClient:  &http.Client{Timeout: 10 * time.Second},
	}, nil
}

func (s *FCMService) getAccessToken(ctx context.Context) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.accessToken != "" && time.Now().Before(s.expiresAt.Add(-2*time.Minute)) {
		return s.accessToken, nil
	}

	now := time.Now()
	headerJSON := `{"alg":"RS256","typ":"JWT"}`
	headerEnc := base64.RawURLEncoding.EncodeToString([]byte(headerJSON))

	claims := map[string]interface{}{
		"iss":   s.clientEmail,
		"scope": "https://www.googleapis.com/auth/firebase.messaging",
		"aud":   s.tokenURI,
		"exp":   now.Add(1 * time.Hour).Unix(),
		"iat":   now.Unix(),
	}
	claimsBytes, _ := json.Marshal(claims)
	claimsEnc := base64.RawURLEncoding.EncodeToString(claimsBytes)

	toSign := fmt.Sprintf("%s.%s", headerEnc, claimsEnc)
	hash := sha256.Sum256([]byte(toSign))
	sigBytes, err := rsa.SignPKCS1v15(nil, s.privateKey, crypto.SHA256, hash[:])
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT: %w", err)
	}
	sigEnc := base64.RawURLEncoding.EncodeToString(sigBytes)
	signedJWT := fmt.Sprintf("%s.%s", toSign, sigEnc)

	formData := url.Values{}
	formData.Set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer")
	formData.Set("assertion", signedJWT)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.tokenURI, strings.NewReader(formData.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("token request failed: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("token exchange failed (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.Unmarshal(bodyBytes, &tokenResp); err != nil {
		return "", fmt.Errorf("failed to parse token response: %w", err)
	}

	s.accessToken = tokenResp.AccessToken
	s.expiresAt = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
	slog.Info("obtained fresh Google OAuth2 token for FCM")
	return s.accessToken, nil
}

type PushMessage struct {
	Title    string            `json:"title"`
	Body     string            `json:"body"`
	Topic    string            `json:"topic,omitempty"`
	Token    string            `json:"token,omitempty"`
	Data     map[string]string `json:"data,omitempty"`
}

func (s *FCMService) Send(ctx context.Context, msg PushMessage) error {
	token, err := s.getAccessToken(ctx)
	if err != nil {
		return fmt.Errorf("failed to get FCM access token: %w", err)
	}

	fcmPayload := map[string]interface{}{}
	messageObj := map[string]interface{}{
		"notification": map[string]string{
			"title": msg.Title,
			"body":  msg.Body,
		},
	}

	if msg.Topic != "" {
		messageObj["topic"] = msg.Topic
	} else if msg.Token != "" {
		messageObj["token"] = msg.Token
	} else {
		messageObj["topic"] = "announcements"
	}

	if len(msg.Data) > 0 {
		messageObj["data"] = msg.Data
	}

	fcmPayload["message"] = messageObj
	payloadBytes, _ := json.Marshal(fcmPayload)

	endpoint := fmt.Sprintf("https://fcm.googleapis.com/v1/projects/%s/messages:send", s.projectID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payloadBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("FCM send request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("FCM send failed (status %d): %s", resp.StatusCode, string(respBody))
	}

	slog.Info("FCM notification dispatched successfully", "status", resp.StatusCode, "response", string(respBody))
	return nil
}
