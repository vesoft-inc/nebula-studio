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
	"strconv"
	"sync"

	"github.com/vesoft-inc/go-pkg/middleware"
	configv3 "github.com/vesoft-inc/nebula-importer/v4/pkg/config/v3"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/importer"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/zeromicro/go-zero/core/logx"
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
	// 校验
	// 初始化
	// 生成目录
	// 生成配置文件
	// 启动任务
	jsons, err := json.Marshal(req.Config)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrParam, err)
	}
	conf := configv3.Config{}
	err = json.Unmarshal(jsons, &conf)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	// init task
	auth := i.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	taskMgr := importer.GetTaskMgr()
	task, taskID, err := taskMgr.NewTask(host, auth.Username, req.Name, conf)
	if err != nil {
		logx.Errorf("init task fail", err)
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	// create task dir
	taskDir, err := importer.CreateTaskDir(i.svcCtx.Config.File.TasksDir, taskID)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	// create config file
	if err := importer.CreateConfigFile(taskDir, conf); err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	// start import
	if err = importer.StartImport(taskID); err != nil {
		//	task err: import task not start err
		task.TaskInfo.TaskStatus = importer.StatusAborted.String()
		err1 := importer.GetTaskMgr().AbortTask(taskID)
		if err != nil {
			logx.Errorf("finish task fail", err1)
		}
		logx.Errorf(fmt.Sprintf("Failed to start a import task: `%s`, task result: `%v`", taskID, err))
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	// write taskId to file
	muTaskId.Lock()
	taskIDBytes, err := ioutil.ReadFile(i.svcCtx.Config.File.TaskIdPath)
	if err != nil {
		logx.Errorf("read taskId file error", err)
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	taskIdJSON := make(map[string]bool)
	if len(taskIDBytes) != 0 {
		if err := json.Unmarshal(taskIDBytes, &taskIdJSON); err != nil {
			logx.Errorf("read taskId file error", err)
			return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
		}
	}
	taskIdJSON[taskID] = true
	bytes, err := json.Marshal(taskIdJSON)
	if err != nil {
		logx.Errorf("read taskId file error", err)
	}
	err = ioutil.WriteFile(i.svcCtx.Config.File.TaskIdPath, bytes, 777)
	if err != nil {
		logx.Errorf("write taskId file error", err)
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
		logx.Errorf("read taskId file error", err)
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	taskIdJSON := make(map[string]bool)
	if len(taskIdBytes) != 0 {
		err = json.Unmarshal(taskIdBytes, &taskIdJSON)
		if err != nil {
			logx.Errorf("parse taskId file error", err)
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

// func validClientParams(conf *importconfig.YAMLConfig) error {
// 	if conf.NebulaClientSettings.Connection == nil ||
// 		conf.NebulaClientSettings.Connection.Address == nil ||
// 		*conf.NebulaClientSettings.Connection.Address == "" ||
// 		conf.NebulaClientSettings.Connection.User == nil ||
// 		*conf.NebulaClientSettings.Connection.User == "" ||
// 		conf.NebulaClientSettings.Space == nil ||
// 		*conf.NebulaClientSettings.Space == "" {
// 		return ecode.WithCode(ecode.ErrParam, nil)
// 	}

// 	return nil
// }

func readFileLines(path string, offset int64, limit int64) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		logx.Errorf("open file error", err)
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
