package config

import (
	"io/ioutil"
	"os"
	"path/filepath"

	"go.uber.org/zap"
	"gopkg.in/yaml.v2"
)

var (
	Cfg = new(Config)
)

type (
	Config struct {
		Web Web `yaml:"web"`
	}

	Web struct {
		TaskIdPath       string `yaml:"task_id_path"`
		UploadDir        string `yaml:"upload_dir"`
		TasksDir         string `yaml:"tasks_dir"`
		SqlitedbFilePath string `yaml:"sqlitedb_file_path"`
		Address          string `yaml:"address"`
		Port             int    `yaml:"port"`
	}
)

const (
	DefaultFilesDataDir      = "data"
	DefaultTaskIdPath       = "data/taskId.data"
	DefaultUploadDir        = "data/upload"
	DefaultTasksDir         = "data/tasks"
	DefaultSqlitedbFilePath = "data/tasks.db"
	DefaultAddress          = "0.0.0.0"
	DefaultPort             = 9000
)

func (c *Config) Validate() error {
	return nil
}

func (w *Web) Validate() error {
	return nil
}

func (c *Config) Complete() {
	c.Web.Complete()
}

func (w *Web) Complete() {
	if w.TaskIdPath == "" {
		_, err := os.Stat(DefaultFilesDataDir )
		if os.IsNotExist(err) {
			os.MkdirAll(DefaultFilesDataDir , 0766)
		}
		abs, _ := filepath.Abs(DefaultTaskIdPath)
		_, err = ioutil.ReadFile(abs)
		if err != nil {
			if os.IsNotExist(err) {
				_, err := os.Create(abs)
				if err != nil {
					zap.L().Fatal("DefaultTaskIdPath Init fail", zap.Error(err))
				}
			} else {
				zap.L().Fatal("DefaultTaskIdPath Init fail", zap.Error(err))
			}
		}
		w.TaskIdPath = abs
	}
	if w.UploadDir == "" {
		abs, _ := filepath.Abs(DefaultUploadDir)
		w.UploadDir = abs
		_, err := os.Stat(abs)
		if os.IsNotExist(err) {
			os.MkdirAll(abs, 0766)
		}
	}
	if w.TasksDir == "" {
		abs, _ := filepath.Abs(DefaultTasksDir)
		w.TasksDir = abs
		_, err := os.Stat(abs)
		if os.IsNotExist(err) {
			os.MkdirAll(abs, 0766)
		}
	}
	if w.SqlitedbFilePath == "" {
		_, err := os.Stat(DefaultFilesDataDir )
		if os.IsNotExist(err) {
			os.MkdirAll(DefaultFilesDataDir , 0766)
		}
		abs, _ := filepath.Abs(DefaultSqlitedbFilePath)
		w.SqlitedbFilePath = abs
	}
	if w.Address == "" {
		w.Address = DefaultAddress
	}
	if w.Port == 0 {
		w.Port = DefaultPort
	}
}

func InitConfig(path string) error {
	yamlFile, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}
	if err := yaml.Unmarshal(yamlFile, Cfg); err != nil {
		return err
	}

	Cfg.Complete()

	return Cfg.Validate()
}
