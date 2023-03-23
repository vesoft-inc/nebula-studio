package filestore

import (
	"bufio"
	"errors"
	"fmt"
	"strings"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
)

type OssStore struct {
	Client *oss.Client
	Bucket *oss.Bucket
}

func NewOssStore(endpoint, bucketName, accessKey, accessSecret string) (*OssStore, error) {
	client, err := oss.New(endpoint, accessKey, accessSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to create oss client: %v", err)
	}
	bucket, err := client.Bucket(bucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to get bucket: %v", err)
	}
	return &OssStore{
		Client: client,
		Bucket: bucket,
	}, nil
}

func (s *OssStore) ReadFile(path string, startLine ...int) ([]string, error) {
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

	resp, err := s.Bucket.GetObject(path)
	if err != nil {
		return nil, err
	}
	defer resp.Close()

	fileScanner := bufio.NewScanner(resp)

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

func (s *OssStore) ListFiles(path string) ([]FileConfig, error) {
	resp, err := s.Bucket.ListObjectsV2(oss.Prefix(path), oss.Delimiter("/"))
	if err != nil {
		return nil, err
	}
	var files []FileConfig

	for _, str := range resp.CommonPrefixes {
		name := str[:len(str)-1] // remove trailing slash
		files = append(files, FileConfig{
			Name: strings.TrimPrefix(name, path),
			Type: "directory",
		})
	}
	for _, obj := range resp.Objects {
		var objType string
		key := obj.Key
		if key[len(key)-1:] == "/" {
			objType = "directory"
		} else if strings.HasSuffix(key, ".csv") {
			objType = "csv"
		}
		name := strings.TrimPrefix(key, path)
		if objType != "" && name != "" {
			s3Object := FileConfig{
				Name: name,
				Type: objType,
				Size: obj.Size,
			}
			files = append(files, s3Object)
		}
	}

	return files, nil
}

func (s *OssStore) ListBuckets() ([]string, error) {
	resp, err := s.Client.ListBuckets()
	if err != nil {
		return nil, err
	}
	var buckets []string
	for _, obj := range resp.Buckets {
		buckets = append(buckets, obj.Name)
	}

	return buckets, nil
}
