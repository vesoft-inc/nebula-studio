package filestore

import (
	"bufio"
	"errors"

	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3iface"
)

type S3Store struct {
	S3Client s3iface.S3API
	Bucket   string
}

func NewS3Store(endpoint, region, bucket, accessKey, accessSecret string) (*S3Store, error) {
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String(region),
		Credentials: credentials.NewStaticCredentials(accessKey, accessSecret, ""),
	})
	if err != nil {
		return nil, errors.New("failed to create session")
	}

	svc := s3.New(sess)
	return &S3Store{
		S3Client: svc,
		Bucket:   bucket,
	}, nil
}

func (s *S3Store) ReadFile(s3path string, startLine ...int) ([]string, error) {
	var numLines int
	var start int
	if len(startLine) == 0 {
		start = 0
		numLines = -1
	} else if len(startLine) == 1 {
		start = startLine[0]
		numLines = -1
	} else {
		start = startLine[0]
		numLines = startLine[1]
	}

	resp, err := s.S3Client.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(s.Bucket),
		Key:    aws.String(s3path),
	})
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	fileScanner := bufio.NewScanner(resp.Body)

	var lines []string
	for i := 0; i < start; i++ {
		if !fileScanner.Scan() {
			return nil, errors.New("start line is beyond end of file")
		}
	}

	for i := 0; numLines < 0 || i < numLines; i++ {
		if !fileScanner.Scan() {
			break
		}
		lines = append(lines, fileScanner.Text())
	}

	if err := fileScanner.Err(); err != nil {
		return nil, err
	}

	return lines, nil
}

func (s *S3Store) ListFiles(s3path string) ([]string, error) {
	resp, err := s.S3Client.ListObjectsV2(&s3.ListObjectsV2Input{
		Bucket:    aws.String(s.Bucket),
		Prefix:    aws.String(s3path),
		Delimiter: aws.String("/"),
	})
	if err != nil {
		return nil, err
	}

	var files []string
	for _, obj := range resp.CommonPrefixes {
		files = append(files, *obj.Prefix)
	}
	for _, obj := range resp.Contents {
		files = append(files, *obj.Key)
	}

	return files, nil
}

func (s *S3Store) ListBuckets() ([]string, error) {
	resp, err := s.S3Client.ListBuckets(&s3.ListBucketsInput{})
	if err != nil {
		return nil, err
	}
	var buckets []string
	for _, obj := range resp.Buckets {
		buckets = append(buckets, *obj.Name)
	}

	return buckets, nil
}
