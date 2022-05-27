package config

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"reflect"

	"github.com/zeromicro/go-zero/rest"
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

type PathValidator struct {
	Type        string // folder | file
	StructAttr  string
	DefaultPath string
}

func (c *Config) Validate() error {
	return nil
}

func (c *Config) Complete() {
	fileValidatorList := []PathValidator{
		{Type: "folder", StructAttr: "UploadDir", DefaultPath: "data/upload"},
		{Type: "folder", StructAttr: "TasksDir", DefaultPath: "data/tasks"},
		{Type: "file", StructAttr: "SqliteDbFilePath", DefaultPath: "data/tasks.db"},
		{Type: "file", StructAttr: "TaskIdPath", DefaultPath: "data/taskId.data"},
	}

	fileRefVal := reflect.ValueOf(&c.File).Elem()

	for _, v := range fileValidatorList {
		pathRef := fileRefVal.FieldByName(v.StructAttr)

		if !pathRef.IsValid() {
			break
		}

		if pathRef.String() == "" {
			pathRef.SetString(v.DefaultPath)
		}

		abs, _ := filepath.Abs(pathRef.String())

		if _, err := os.Stat(abs); os.IsNotExist(err) {
			if v.Type == "folder" {
				os.MkdirAll(abs, os.ModePerm)
			} else if v.Type == "file" {
				if _, err := os.Stat(filepath.Dir(abs)); os.IsNotExist(err) {
					os.MkdirAll(filepath.Dir(abs), os.ModePerm)
				}
				ioutil.WriteFile(abs, []byte(""), os.ModePerm)
			}
		}
	}
}

func (c *Config) InitConfig() error {
	c.Complete()

	return c.Validate()
}
