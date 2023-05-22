package filestore

import (
	"encoding/json"
	"errors"
)

type (
	FileStore interface {
		ReadFile(path string, startLine ...int) ([]string, error)
		ListFiles(dir string) ([]FileConfig, error)
		Close() error
	}

	FileConfig struct {
		Type string
		Name string
		Size int64
	}

	SftpConfig struct {
		Host     string
		Port     int
		Username string
		Password string
	}

	S3Config struct {
		Endpoint     string
		Region       string
		Bucket       string
		AccessKeyID  string
		AccessSecret string
	}
)

func NewFileStore(typ, config, secret, platform string) (FileStore, error) {
	switch typ {
	case "s3":
		var c S3Config
		if err := json.Unmarshal([]byte(config), &c); err != nil {
			return nil, errors.New("parse the s3 config error")
		}
		return NewS3Store(platform, c.Endpoint, c.Region, c.Bucket, c.AccessKeyID, secret)
	case "sftp":
		var c SftpConfig
		if err := json.Unmarshal([]byte(config), &c); err != nil {
			return nil, errors.New("parse the s3 config error")
		}
		return NewSftpStore(c.Host, c.Port, c.Username, secret)
	}

	return nil, errors.New("don't support this store type")
}
