package service

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"github.com/vesoft-inc/go-pkg/middleware"
	importconfig "github.com/vesoft-inc/nebula-importer/pkg/config"
	importererrors "github.com/vesoft-inc/nebula-importer/pkg/errors"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/importer"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/core/logx"
	"go.uber.org/zap"
)

var (
	_        ImportService = (*importService)(nil)
	muTaskId sync.RWMutex
)

const (
	importLogName = "import.log"
	errContentDir = "err"
)

type (
	ImportService interface {
		CreateImportTask(*types.CreateImportTaskRequest) (*types.CreateImportTaskData, error)
		StopImportTask(request *types.StopImportTaskRequest) error
		DownloadConfig(*types.DownloadConfigsRequest) error
		DownloadLogs(request *types.DownloadLogsRequest) error
		DeleteImportTask(*types.DeleteImportTaskRequest) error
		GetImportTask(*types.GetImportTaskRequest) (*types.GetImportTaskData, error)
		GetManyImportTask(request *types.GetManyImportTaskRequest) (*types.GetManyImportTaskData, error)
		GetImportTaskLogNames(request *types.GetImportTaskLogNamesRequest) (*types.GetImportTaskLogNamesData, error)
		GetManyImportTaskLog(request *types.GetManyImportTaskLogRequest) (*types.GetManyImportTaskLogData, error)
		GetWorkingDir() (*types.GetWorkingDirResult, error)
	}

	importService struct {
		logx.Logger
		ctx    context.Context
		svcCtx *svc.ServiceContext
	}
)

func NewImportService(ctx context.Context, svcCtx *svc.ServiceContext) ImportService {
	return &importService{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (i *importService) CreateImportTask(req *types.CreateImportTaskRequest) (*types.CreateImportTaskData, error) {
	jsons, err := json.Marshal(req.Config)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrParam, err)
	}

	conf := importconfig.YAMLConfig{}
	err = json.Unmarshal(jsons, &conf)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	if err = validClientParams(&conf); err != nil {
		err = importererrors.Wrap(importererrors.InvalidConfigPathOrFormat, err)
		zap.L().Warn("client params is wrong", zap.Error(err))
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	taskDir, err := importer.GetNewTaskDir(i.svcCtx.Config.File.TasksDir)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	logPath := filepath.Join(taskDir, importLogName)
	conf.LogPath = &logPath

	// create config file
	if err := importer.CreateConfigFile(i.svcCtx.Config.File.UploadDir, taskDir, conf); err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	// create err dir
	taskErrDir := filepath.Join(taskDir, "err")
	if err = utils.CreateDir(taskErrDir); err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	// import
	nebulaAddress := *conf.NebulaClientSettings.Connection.Address
	user := *conf.NebulaClientSettings.Connection.User
	name := req.Name
	space := *conf.NebulaClientSettings.Space
	task, taskID, err := importer.GetTaskMgr().NewTask(nebulaAddress, user, name, space)
	if err != nil {
		zap.L().Warn("init task fail", zap.Error(err))
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	if err = importer.Import(taskID, &conf); err != nil {
		//	task err: import task not start err
		task.TaskInfo.TaskStatus = importer.StatusAborted.String()
		err1 := importer.GetTaskMgr().AbortTask(taskID)
		if err != nil {
			zap.L().Warn("finish task fail", zap.Error(err1))
		}
		zap.L().Error(fmt.Sprintf("Failed to start a import task: `%s`, task result: `%v`", taskID, err))
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	// write taskId to file
	muTaskId.Lock()
	taskIDBytes, err := ioutil.ReadFile(i.svcCtx.Config.File.TaskIdPath)
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	taskIdJSON := make(map[string]bool)
	if len(taskIDBytes) != 0 {
		if err := json.Unmarshal(taskIDBytes, &taskIdJSON); err != nil {
			zap.L().Warn("read taskId file error", zap.Error(err))
			return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
		}
	}
	taskIdJSON[taskID] = true
	bytes, err := json.Marshal(taskIdJSON)
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
	}
	err = ioutil.WriteFile(i.svcCtx.Config.File.TaskIdPath, bytes, 777)
	if err != nil {
		zap.L().Warn("write taskId file error", zap.Error(err))
	}
	defer muTaskId.Unlock()

	return &types.CreateImportTaskData{
		Id: taskID,
	}, nil
}

func (i *importService) StopImportTask(req *types.StopImportTaskRequest) error {
	auth := i.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := fmt.Sprintf("%s:%d", auth.Address, auth.Port)
	return importer.StopImportTask(req.Id, host, auth.Username)
}

func (i *importService) DownloadConfig(req *types.DownloadConfigsRequest) error {
	httpReq, ok := middleware.GetRequest(i.ctx)
	if !ok {
		return ecode.WithInternalServer(fmt.Errorf("unset KeepRequest"))
	}

	httpResp, ok := middleware.GetResponseWriter(i.ctx)
	if !ok {
		return ecode.WithInternalServer(fmt.Errorf("unset KeepResponse Writer"))
	}

	configPath := filepath.Join(i.svcCtx.Config.File.TasksDir, req.Id, "config.yaml")
	httpResp.Header().Set("Content-Type", "application/octet-stream")
	httpResp.Header().Set("Content-Disposition", "attachment;filename="+filepath.Base(configPath))
	http.ServeFile(httpResp, httpReq, configPath)

	return nil
}

func (i *importService) DownloadLogs(req *types.DownloadLogsRequest) error {
	id := req.Id

	httpReq, ok := middleware.GetRequest(i.ctx)
	if !ok {
		return ecode.WithInternalServer(fmt.Errorf("unset KeepRequest"))
	}

	httpResp, ok := middleware.GetResponseWriter(i.ctx)
	if !ok {
		return ecode.WithInternalServer(fmt.Errorf("unset KeepResponse Writer"))
	}

	filename := req.Name
	path := ""
	if filename == importLogName {
		path = filepath.Join(i.svcCtx.Config.File.TasksDir, id, filename)
	} else {
		path = filepath.Join(i.svcCtx.Config.File.TasksDir, id, "err", filename)
	}

	httpResp.Header().Set("Content-Type", "application/octet-stream")
	httpResp.Header().Set("Content-Disposition", "attachment;filename="+filepath.Base(path))
	http.ServeFile(httpResp, httpReq, path)
	return nil
}

func (i *importService) DeleteImportTask(req *types.DeleteImportTaskRequest) error {
	auth := i.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := fmt.Sprintf("%s:%d", auth.Address, auth.Port)
	return importer.DeleteImportTask(i.svcCtx.Config.File.TasksDir, req.Id, host, auth.Username)
}

func (i *importService) GetImportTask(req *types.GetImportTaskRequest) (*types.GetImportTaskData, error) {
	auth := i.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := fmt.Sprintf("%s:%d", auth.Address, auth.Port)
	return importer.GetImportTask(i.svcCtx.Config.File.TasksDir, req.Id, host, auth.Username)
}

func (i *importService) GetManyImportTask(req *types.GetManyImportTaskRequest) (*types.GetManyImportTaskData, error) {
	auth := i.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := fmt.Sprintf("%s:%d", auth.Address, auth.Port)
	return importer.GetManyImportTask(i.svcCtx.Config.File.TasksDir, host, auth.Username, req.Page, req.PageSize)
}

// GetImportTaskLogNames :Get all log file's name of a task
func (i *importService) GetImportTaskLogNames(req *types.GetImportTaskLogNamesRequest) (*types.GetImportTaskLogNamesData, error) {
	id := req.Id

	errLogDir := filepath.Join(i.svcCtx.Config.File.TasksDir, id, "err")
	fileInfos, err := ioutil.ReadDir(errLogDir)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	data := &types.GetImportTaskLogNamesData{
		Names: []string{},
	}
	data.Names = append(data.Names, importLogName)
	for _, fileInfo := range fileInfos {
		name := fileInfo.Name()
		data.Names = append(data.Names, name)
	}
	return data, nil
}

func (i *importService) GetManyImportTaskLog(req *types.GetManyImportTaskLogRequest) (*types.GetManyImportTaskLogData, error) {
	path := ""
	if req.File == importLogName {
		path = filepath.Join(i.svcCtx.Config.File.TasksDir, req.Id, req.File)
	} else {
		path = filepath.Join(i.svcCtx.Config.File.TasksDir, req.Id, errContentDir, req.File)
	}
	lines, err := readFileLines(path, req.Offset, req.Limit)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	muTaskId.RLock()
	taskIdBytes, err := ioutil.ReadFile(i.svcCtx.Config.File.TaskIdPath)
	muTaskId.RUnlock()
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	taskIdJSON := make(map[string]bool)
	if len(taskIdBytes) != 0 {
		err = json.Unmarshal(taskIdBytes, &taskIdJSON)
		if err != nil {
			zap.L().Warn("parse taskId file error", zap.Error(err))
			return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
		}
	}
	data := &types.GetManyImportTaskLogData{
		Logs: lines,
	}
	if len(lines) == 0 && taskIdJSON[req.Id] {
		return data, nil
	}
	if len(lines) == 0 {
		return data, ecode.WithErrorMessage(ecode.ErrInternalServer, errors.New("no task"))
	}

	return data, nil
}

func (i *importService) GetWorkingDir() (*types.GetWorkingDirResult, error) {
	return &types.GetWorkingDirResult{
		TaskDir:   i.svcCtx.Config.File.TasksDir,
		UploadDir: i.svcCtx.Config.File.UploadDir,
	}, nil
}

func validClientParams(conf *importconfig.YAMLConfig) error {
	if conf.NebulaClientSettings.Connection == nil ||
		conf.NebulaClientSettings.Connection.Address == nil ||
		*conf.NebulaClientSettings.Connection.Address == "" ||
		conf.NebulaClientSettings.Connection.User == nil ||
		*conf.NebulaClientSettings.Connection.User == "" ||
		conf.NebulaClientSettings.Space == nil ||
		*conf.NebulaClientSettings.Space == "" {
		return ecode.WithCode(ecode.ErrParam, nil)
	}

	return nil
}

func readFileLines(path string, offset int64, limit int64) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		zap.L().Warn("open file error", zap.Error(err))
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
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
