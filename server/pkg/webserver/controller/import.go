package controller

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	importconfig "github.com/vesoft-inc/nebula-importer/pkg/config"
	"github.com/vesoft-inc/nebula-studio/server/pkg/config"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"
	"gopkg.in/yaml.v2"
)

type dirResponse struct {
	TaskDir   string `json:"taskDir,omitempty"`
	UploadDir string `json:"uploadDir,omitempty"`
}

var muTaskId sync.RWMutex

func ReadLog(ctx iris.Context) base.Result {
	startByte, _ := strconv.ParseInt(ctx.URLParam("startByte"), 10, 64)
	endByte, _ := strconv.ParseInt(ctx.URLParam("endByte"), 10, 64)
	dir := ctx.URLParam("dir")
	taskId := ctx.URLParam("ReadJSON")

	path := filepath.Join(dir, "import.log")
	bytes, err := readFile(path, startByte, endByte)
	if err != nil {
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}

	muTaskId.RLock()
	taskIdBytes, err := ioutil.ReadFile(config.Cfg.Web.TaskIdPath)
	muTaskId.RUnlock()
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	taskIdJSON := make(map[string]bool)

	if len(taskIdBytes) != 0 {
		err = json.Unmarshal(taskIdBytes, &taskIdJSON)
		if err != nil {
			zap.L().Warn("parse taskId file error", zap.Error(err))
			return base.Response{
				Code:    base.Error,
				Message: err.Error(),
			}
		}
	}
	if len(bytes) == 0 {
		if taskIdJSON[taskId] {
			return base.Response{
				Code: base.Success,
				Data: "",
			}
		} else {
			time.Sleep(1 * time.Second)
			bytes, err = readFile(path, startByte, endByte)
			if err != nil {
				return base.Response{
					Code:    base.Error,
					Message: err.Error(),
				}
			}
		}
	}

	if len(bytes) == 0 {
		return base.Response{
			Code: base.Error,
		}
	}

	log := string(bytes)
	log = strings.Replace(log, "\n", "<br />", -1)
	return base.Response{
		Code: base.Success,
		Data: log,
	}
}

func readFile(path string, startByte, endByte int64) ([]byte, error) {
	file, err := os.Open(path)
	defer file.Close()
	if err != nil {
		zap.L().Warn("open file error", zap.Error(err))
		return nil, err
	}
	_, err = file.Seek(startByte, 0)
	if err != nil {
		zap.L().Warn("file seek error", zap.Error(err))
		return nil, err
	}
	stat, _ := file.Stat()
	if stat.Size() < endByte {
		endByte = stat.Size()
	}
	if endByte < startByte {
		bytes := make([]byte, 0)
		return bytes, nil
	}
	bytes := make([]byte, endByte-startByte)
	_, err = file.Read(bytes)
	if err != nil {
		zap.L().Warn("read file error", zap.Error(err))
		return nil, err
	}
	return bytes, nil
}

func CreateConfigFile(ctx iris.Context) base.Result {
	type Params struct {
		MountPath string                  `json:"mountPath"`
		Config    importconfig.YAMLConfig `json:"config"`
	}
	params := new(Params)
	err := ctx.ReadJSON(params)
	if err != nil {
		zap.L().Warn("config change to json wrong", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}

	fileName := "config.yaml"
	dir := params.MountPath
	_, err = os.Stat(dir)
	if os.IsNotExist(err) {
		os.MkdirAll(dir, os.ModePerm)
	}
	path := filepath.Join(dir, fileName)
	outYaml, err := yaml.Marshal(params.Config)
	err = os.WriteFile(path, outYaml, 0644)
	if err != nil {
		zap.L().Warn("write"+path+"file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}

	return base.Response{
		Code: base.Success,
	}
}

func Callback(ctx iris.Context) base.Result {
	type Params struct {
		TaskId string `json:"taskId"`
	}
	params := new(Params)
	err := ctx.ReadJSON(params)
	if err != nil {
		zap.L().Warn("taskId get fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	taskId := params.TaskId

	muTaskId.RLock()
	taskIdBytes, err := ioutil.ReadFile(config.Cfg.Web.TaskIdPath)
	muTaskId.RUnlock()
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	taskIdJSON := make(map[string]bool)
	if len(taskIdBytes) != 0 {
		err := json.Unmarshal(taskIdBytes, &taskIdJSON)
		if err != nil {
			zap.L().Warn("parse taskId file error", zap.Error(err))
			return base.Response{
				Code:    base.Error,
				Message: err.Error(),
			}
		}
	}

	taskIdJSON[taskId] = true
	jsonStr, err := json.Marshal(taskIdJSON)
	if err != nil {
		zap.L().Warn("map to json error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}

	muTaskId.Lock()
	err = os.WriteFile(config.Cfg.Web.TaskIdPath, jsonStr, 0644)
	muTaskId.Unlock()
	if err != nil {
		zap.L().Warn("write jsonId file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}

	return base.Response{
		Code:    base.Success,
		Data:    "",
		Message: "",
	}
}

func GetWorkingDir(ctx iris.Context) base.Result {
	data := dirResponse{
		TaskDir:   config.Cfg.Web.TasksDir,
		UploadDir: config.Cfg.Web.UploadDir,
	}
	return base.Response{
		Code: base.Success,
		Data: data,
	}
}
