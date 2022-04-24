package controller

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strconv"
	"sync"

	importconfig "github.com/vesoft-inc/nebula-importer/pkg/config"
	importerErrors "github.com/vesoft-inc/nebula-importer/pkg/errors"
	"github.com/vesoft-inc/nebula-importer/pkg/logger"
	"github.com/vesoft-inc/nebula-studio/server/pkg/config"
	"github.com/vesoft-inc/nebula-studio/server/pkg/utils"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/service/importer"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"
)

type dirResponse struct {
	TaskDir   string `json:"taskDir,omitempty"`
	UploadDir string `json:"uploadDir,omitempty"`
}

type log struct {
	Name string `json:"name"`
}

type importDataParams struct {
	ConfigPath string                   `json:"configPath"`
	ConfigBody *importconfig.YAMLConfig `json:"configBody"`
	Name       string                   `json:"name"`
}

type handleImportActionParams struct {
	TaskId     string `json:"taskId"`
	TaskAction string `json:"taskAction"`
}

const (
	importLogName = "import.log"
	errContentDir = "err"
)

var muTaskId sync.RWMutex

func ImportData(ctx iris.Context) base.Result {
	params := new(importDataParams)
	err := ctx.ReadJSON(params)
	if err != nil {
		zap.L().Warn("importDataParams get fail", zap.Error(err))
		err = importerErrors.Wrap(importerErrors.InvalidConfigPathOrFormat, err)
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}

	runnerLogger := logger.NewRunnerLogger(*params.ConfigBody.LogPath)
	if params.ConfigPath != "" {
		params.ConfigBody, err = importconfig.Parse(params.ConfigPath, runnerLogger)
		if err != nil {
			return base.Response{
				Code:    base.Error,
				Message: err.(importerErrors.ImporterError).Error(),
			}
		}
	}

	if err = validClientParams(params); err != nil {
		err = importerErrors.Wrap(importerErrors.InvalidConfigPathOrFormat, err)
		zap.L().Warn("client params is wrong", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	// create config file
	taskDir, err := importer.GetNewTaskDir()
	if err != nil {
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	if err := importer.CreateConfigFile(taskDir, *params.ConfigBody); err != nil {
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	// create err dir
	taskErrDir := filepath.Join(taskDir, "err")
	if err = utils.CreateDir(taskErrDir); err != nil {
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	// import
	nebulaAddress := *params.ConfigBody.NebulaClientSettings.Connection.Address
	user := *params.ConfigBody.NebulaClientSettings.Connection.User
	name := params.Name
	space := *params.ConfigBody.NebulaClientSettings.Space
	task, taskID, err := importer.GetTaskMgr().NewTask(nebulaAddress, user, name, space)
	if err != nil {
		zap.L().Warn("init task fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	if err = importer.Import(taskID, params.ConfigBody); err != nil {
		// task err: import task not start err handle
		task.TaskInfo.TaskStatus = importer.StatusAborted.String()
		err1 := importer.GetTaskMgr().AbortTask(taskID)
		if err1 != nil {
			zap.L().Warn("finish task fail", zap.Error(err1))
		}
		zap.L().Error(fmt.Sprintf("Failed to start a import task: `%s`, task result: `%v`", taskID, err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	// write taskId to file
	muTaskId.Lock()
	taskIdBytes, err := ioutil.ReadFile(config.Cfg.Web.TaskIdPath)
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	taskIdJSON := make(map[string]bool)
	if len(taskIdBytes) != 0 {
		if err := json.Unmarshal(taskIdBytes, &taskIdJSON); err != nil {
			zap.L().Warn("read taskId file error", zap.Error(err))
			return base.Response{
				Code:    base.Error,
				Message: err.Error(),
			}
		}
	}
	taskIdJSON[taskID] = true
	bytes, err := json.Marshal(taskIdJSON)
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	err = ioutil.WriteFile(config.Cfg.Web.TaskIdPath, bytes, 777)
	if err != nil {
		zap.L().Warn("write taskId file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	defer muTaskId.Unlock()
	return base.Response{
		Code:    base.Success,
		Data:    []string{taskID},
		Message: fmt.Sprintf("Import task %s submit successfully", taskID),
	}
}

func HandleImportAction(ctx iris.Context) base.Result {
	params := new(handleImportActionParams)
	err := ctx.ReadJSON(params)
	if err != nil {
		zap.L().Warn("handleImportActionParams get fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	nebulaAddress := ctx.Values().GetString("nebulaAddress")
	username := ctx.Values().GetString("username")
	data, err := importer.ImportAction(params.TaskId, nebulaAddress, username, importer.NewTaskAction(params.TaskAction))
	if err != nil {
		zap.L().Warn("importAction fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	return base.Response{
		Code:    base.Success,
		Message: "Processing a task action successfully",
		Data:    data,
	}
}

func DownloadConfigFile(ctx iris.Context) base.Result {
	id := ctx.Params().GetString("id")
	if id == "" {
		return base.Response{
			Code:    base.Error,
			Message: "id parse failed",
		}
	}
	configPath := filepath.Join(config.Cfg.Web.TasksDir, id, "config.yaml")
	if err := ctx.SendFile(configPath, "config.yaml"); err != nil {
		return base.Response{
			Code:    base.Error,
			Message: "id parse failed",
		}
	}
	return nil
}

func DownloadImportLog(ctx iris.Context) base.Result {
	id := ctx.Params().GetString("id")
	if id == "" {
		return base.Response{
			Code:    base.Error,
			Message: "id parse failed",
		}
	}
	path := filepath.Join(config.Cfg.Web.TasksDir, id, importLogName)
	if err := ctx.SendFile(path, importLogName); err != nil {
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	return nil
}

func DownloadErrLog(ctx iris.Context) base.Result {
	id := ctx.Params().GetString("id")
	if id == "" {
		return base.Response{
			Code:    base.Error,
			Message: "id parse failed",
		}
	}
	name := ctx.URLParam("name")
	if name == "" {
		return base.Response{
			Code:    base.Error,
			Message: "name parse failed",
		}
	}
	path := filepath.Join(config.Cfg.Web.TasksDir, id, errContentDir, name)
	if err := ctx.SendFile(path, name); err != nil {
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	return nil
}

func validClientParams(params *importDataParams) error {
	if params.ConfigBody.NebulaClientSettings.Connection == nil ||
		params.ConfigBody.NebulaClientSettings.Connection.Address == nil ||
		*params.ConfigBody.NebulaClientSettings.Connection.Address == "" ||
		params.ConfigBody.NebulaClientSettings.Connection.User == nil ||
		*params.ConfigBody.NebulaClientSettings.Connection.User == "" ||
		params.ConfigBody.NebulaClientSettings.Space == nil ||
		*params.ConfigBody.NebulaClientSettings.Space == "" {
		return errors.New("client params is wrong")
	}
	return nil
}

func ReadImportLog(ctx iris.Context) base.Result {
	offset, err := strconv.ParseInt(ctx.URLParam("offset"), 10, 64)
	if err != nil {
		zap.L().Warn("offset parse error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	limitStr := ctx.URLParam("limit")
	var limit int64 = -1
	if limitStr != "" {
		l, err := strconv.ParseInt(limitStr, 10, 64)
		if err != nil {
			zap.L().Warn("limit parse error", zap.Error(err))
			return base.Response{
				Code:    base.Error,
				Message: err.Error(),
			}
		}
		limit = l
	}
	taskId := ctx.URLParam("id")
	if taskId == "" {
		return base.Response{
			Code:    base.Error,
			Message: "parse id fail",
		}
	}
	path := filepath.Join(config.Cfg.Web.TasksDir, taskId, importLogName)
	lines, err := readFile(path, offset, limit)
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
	if len(lines) == 0 && taskIdJSON[taskId] {
		return base.Response{
			Code: base.Success,
			Data: "",
		}
	}
	if len(lines) == 0 {
		return base.Response{
			Code: base.Error,
		}
	}
	return base.Response{
		Code: base.Success,
		Data: lines,
	}
}

func ReadErrLog(ctx iris.Context) base.Result {
	offset, err := strconv.ParseInt(ctx.URLParam("offset"), 10, 64)
	if err != nil {
		zap.L().Warn("offset parse error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	limitStr := ctx.URLParam("limit")
	var limit int64 = -1
	if limitStr != "" {
		l, err := strconv.ParseInt(limitStr, 10, 64)
		if err != nil {
			zap.L().Warn("limit parse error", zap.Error(err))
			return base.Response{
				Code:    base.Error,
				Message: err.Error(),
			}
		}
		limit = l
	}
	name := ctx.URLParam("name")
	if name == "" {
		return base.Response{
			Code:    base.Error,
			Message: "parse name fail",
		}
	}
	taskId := ctx.URLParam("id")
	if taskId == "" {
		return base.Response{
			Code:    base.Error,
			Message: "parse id fail",
		}
	}
	path := filepath.Join(config.Cfg.Web.TasksDir, taskId, errContentDir, name)
	lines, err := readFile(path, offset, limit)
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
	if len(lines) == 0 && taskIdJSON[taskId] {
		return base.Response{
			Code: base.Success,
			Data: "",
		}
	}
	if len(lines) == 0 {
		return base.Response{
			Code: base.Error,
		}
	}
	return base.Response{
		Code: base.Success,
		Data: lines,
	}
}

func readFile(path string, offset int64, limit int64) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		zap.L().Warn("open file error", zap.Error(err))
		return nil, err
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	res := make([]string, 0)
	if limit != -1 {
		for lineIndex := int64(0); scanner.Scan() && lineIndex < offset+limit; lineIndex++ {
			if lineIndex >= offset {
				res = append(res, scanner.Text())
			}
		}
	} else {
		for lineIndex := int64(0); scanner.Scan(); lineIndex++ {
			if lineIndex >= offset {
				res = append(res, scanner.Text())
			}
		}
	}
	return res, nil
}

func GetWorkingDir(ctx iris.Context) base.Result {
	data := dirResponse{
		UploadDir: config.Cfg.Web.UploadDir,
	}
	return base.Response{
		Code: base.Success,
		Data: data,
	}
}

func GetTaskDir(ctx iris.Context) base.Result {
	taskDir, err := importer.GetNewTaskDir()
	if err != nil {
		return base.Response{
			Code: base.Error,
		}
	}
	data := dirResponse{
		TaskDir: taskDir,
	}
	return base.Response{
		Code: base.Success,
		Data: data,
	}
}

func GetTaskLogNames(ctx iris.Context) base.Result {
	id := ctx.Params().GetString("id")
	errLogDir := filepath.Join(config.Cfg.Web.TasksDir, id, "err")
	fileInfos, err := ioutil.ReadDir(errLogDir)
	if err != nil {
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	logs := make([]log, 0)
	importLog := log{
		Name: "import.log",
	}
	logs = append(logs, importLog)
	for _, fileInfo := range fileInfos {
		name := fileInfo.Name()
		l := log{
			Name: name,
		}
		logs = append(logs, l)
	}
	return base.Response{
		Code: base.Success,
		Data: logs,
	}
}
