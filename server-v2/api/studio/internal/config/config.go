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
	taskIdFile := DefaultTaskIdPath
	if c.File.TaskIdPath != "" {
		taskIdFile = c.File.TaskIdPath
	}
	abs, _ := filepath.Abs(taskIdFile)
	_, err := ioutil.ReadFile(abs)
	if err != nil {
		if os.IsNotExist(err) {
			absDir := filepath.Dir(abs)
			_, err := os.Stat(absDir)
			if os.IsNotExist(err) {
				os.MkdirAll(absDir, 0o776)
			}
			_, err = os.Create(abs)
			if err != nil {
				zap.L().Fatal("DefaultTaskIdPath Init fail", zap.Error(err))
			}
		}
	}
	c.File.TaskIdPath = abs

	uploadDir := DefaultUploadDir
	if c.File.UploadDir != "" {
		uploadDir = c.File.UploadDir
	}
	abs, _ = filepath.Abs(uploadDir)
	c.File.UploadDir = abs
	_, err = os.Stat(abs)
	if os.IsNotExist(err) {
		os.MkdirAll(abs, 0o776)
	}

	tasksDir := DefaultTasksDir
	if c.File.TasksDir != "" {
		tasksDir = c.File.TasksDir
	}
	abs, _ = filepath.Abs(tasksDir)
	c.File.TasksDir = abs
	_, err = os.Stat(abs)
	if os.IsNotExist(err) {
		os.MkdirAll(abs, 0o776)
	}

	sqliteDbFilePath := DefaultSqliteDbFilePath
	if c.File.SqliteDbFilePath != "" {
		sqliteDbFilePath = c.File.SqliteDbFilePath
	}
	abs, _ = filepath.Abs(sqliteDbFilePath)
	_, err = ioutil.ReadFile(abs)
	if err != nil {
		if os.IsNotExist(err) {
			absDir := filepath.Dir(abs)
			_, err := os.Stat(absDir)
			if os.IsNotExist(err) {
				os.MkdirAll(absDir, 0o776)
			}
			_, err = os.Create(abs)
			if err != nil {
				zap.L().Fatal("SqliteDbFilePath Init fail", zap.Error(err))
			}
		}
	}
	c.File.SqliteDbFilePath = abs
}

func (c *Config) InitConfig() error {
	c.Complete()

	return c.Validate()
}
