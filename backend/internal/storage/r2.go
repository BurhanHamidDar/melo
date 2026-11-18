package storage

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type StorageClient interface {
	PresignPutURL(ctx context.Context, bucket, key, contentType string, ttl time.Duration) (string, error)
	PresignGetURL(ctx context.Context, bucket, key string, ttl time.Duration) (string, error)
	Upload(ctx context.Context, bucket, key, contentType string, body io.Reader) error
}

type R2Client struct {
	client        *s3.Client
	presignClient *s3.PresignClient
	endpoint      string
	accountID     string
}

func NewR2Client(accountID, accessKey, secretKey, endpoint string) (*R2Client, error) {
	if accessKey == "" || secretKey == "" {
		slog.Info("R2 credentials not provided, storage operating in fallback mode")
		return nil, nil
	}

	if endpoint == "" && accountID != "" {
		endpoint = fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)
	}

	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL:               endpoint,
			SigningRegion:     "auto",
			HostnameImmutable: true,
		}, nil
	})

	s3Config := aws.Config{
		Region:                      "auto",
		Credentials:                 credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		EndpointResolverWithOptions: customResolver,
	}

	s3Client := s3.NewFromConfig(s3Config, func(o *s3.Options) {
		o.UsePathStyle = true
	})

	return &R2Client{
		client:        s3Client,
		presignClient: s3.NewPresignClient(s3Client),
		endpoint:      endpoint,
		accountID:     accountID,
	}, nil
}

func (r *R2Client) PresignPutURL(ctx context.Context, bucket, key, contentType string, ttl time.Duration) (string, error) {
	if r == nil || r.presignClient == nil {
		return "", fmt.Errorf("R2 client is not configured")
	}

	req, err := r.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned PUT url: %w", err)
	}

	return req.URL, nil
}

func (r *R2Client) PresignGetURL(ctx context.Context, bucket, key string, ttl time.Duration) (string, error) {
	if r == nil || r.presignClient == nil {
		return "", fmt.Errorf("R2 client is not configured")
	}

	req, err := r.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned GET url: %w", err)
	}

	return req.URL, nil
}

func (r *R2Client) Upload(ctx context.Context, bucket, key, contentType string, body io.Reader) error {
	if r == nil || r.client == nil {
		return fmt.Errorf("R2 client is not configured")
	}

	_, err := r.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
		Body:        body,
	})
	return err
}
