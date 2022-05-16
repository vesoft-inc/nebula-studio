package config

import (
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/zeromicro/go-zero/rest"
	"go.uber.org/zap"
)

type Config struct {
	rest.RestConf
	Debug struct {
		Enable bool
	}
	Auth struct {
		AccessSecret string
		AccessExpire int64
	}

	File struct {
		UploadDir        string
		TasksDir         string
		SqliteDbFilePath string
		TaskIdPath       string
	}
}

const (
	DefaultFilesDataDir     = "data"
	DefaultTaskIdPath       = "data/taskId.data"
	DefaultUploadDir        = "data/upload"
	DefaultTasksDir         = "data/tasks"
	DefaultSqliteDbFilePath = "data/tasks.db"
)

func (c *Config) Validate() error {
	return nil
}

func (c *Config) Complete() {
	if c.File.TaskIdPath == "" {
		_, err := os.Stat(DefaultFilesDataDir)
		if os.IsNotExist(err) {
			os.MkdirAll(DefaultFilesDataDir, 0o766)
		}
		abs, _ := filepath.Abs(DefaultTaskIdPath)
		_, err = ioutil.ReadFile(abs)
		if err != nil {
			if os.IsNotExist(err) {
				_, err := os.Create(abs)
				if err != nil {
					zap.L().Fatal("DefaultTaskIdPath Init fail", zap.Error(err))
				} else {
					zap.L().Fatal("DefaultTaskIdPath Init fail", zap.Error(err))
				}
			}
		}
		c.File.TaskIdPath = abs
	}

	if c.File.UploadDir == "" {
		abs, _ := filepath.Abs(DefaultUploadDir)
		c.File.UploadDir = abs
		_, err := os.Stat(abs)
		if os.IsNotExist(err) {
			os.MkdirAll(abs, 0o776)
		}
	}

	if c.File.TasksDir == "" {
		abs, _ := filepath.Abs(DefaultTasksDir)
		c.File.TasksDir = abs
		_, err := os.Stat(abs)
		if os.IsNotExist(err) {
			os.MkdirAll(abs, 0o766)
		}
	}

	if c.File.SqliteDbFilePath == "" {
		_, err := os.Stat(DefaultFilesDataDir)
		if os.IsNotExist(err) {
			os.MkdirAll(DefaultFilesDataDir, 0o766)
		}
		abs, _ := filepath.Abs(DefaultSqliteDbFilePath)
		c.File.SqliteDbFilePath = abs
	}
}

func (c *Config) InitConfig() error {
	c.Complete()

	return c.Validate()
}
