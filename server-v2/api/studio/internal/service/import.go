package service

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	importconfig "github.com/vesoft-inc/nebula-importer/pkg/config"
	importerErrors "github.com/vesoft-inc/nebula-importer/pkg/errors"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/importer"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	Config "github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/core/logx"
	"go.uber.org/zap"
	"io/ioutil"
	"os"
	"path/filepath"
	"sync"
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
		DownloadConfig(*types.DownloadConfigsRequest) (*types.DownloadConfigsData, error)
		DownloadLogs(request *types.DownloadLogsRequest) (*types.DownloadLogsData, error)
		DeleteImportTask(*types.DeleteImportTaskRequest) error
		GetImportTask(*types.GetImportTaskRequest) (*types.GetImportTaskData, error)
		GetManyImportTask(request *types.GetManyImportTaskRequest) (*types.GetManyImportTaskData, error)
		GetImportTaskLogNames(request *types.GetImportTaskLogNamesRequest) (*types.GetImportTaskLogNamesData, error)
		GetManyImportTaskLog(request *types.GetManyImportTaskLogRequest) (*types.GetManyImportTaskLogData, error)
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
		return nil, errors.New("importDataParams get fail")
	}

	conf := importconfig.YAMLConfig{}
	err = json.Unmarshal(jsons, &conf)
	if err != nil {
		return nil, err
	}

	if err = validClientParams(&conf); err != nil {
		err = importerErrors.Wrap(importerErrors.InvalidConfigPathOrFormat, err)
		zap.L().Warn("client params is wrong", zap.Error(err))
		return nil, err
	}

	taskDir, err := importer.GetNewTaskDir()
	if err != nil {
		return nil, err
	}
	logPath := filepath.Join(taskDir, "import.log")
	conf.LogPath = &logPath

	// create config file
	if err := importer.CreateConfigFile(taskDir, conf); err != nil {
		return nil, err
	}

	// create err dir
	taskErrDir := filepath.Join(taskDir, "err")
	if err = utils.CreateDir(taskErrDir); err != nil {
		return nil, err
	}

	// import
	nebulaAddress := *conf.NebulaClientSettings.Connection.Address
	user := *conf.NebulaClientSettings.Connection.User
	name := req.Name
	space := *conf.NebulaClientSettings.Space
	task, taskID, err := importer.GetTaskMgr().NewTask(nebulaAddress, user, name, space)
	if err != nil {
		zap.L().Warn("init task fail", zap.Error(err))
		return nil, err
	}
	if err = importer.Import(taskID, &conf); err != nil {
		//	task err: import task not start err
		task.TaskInfo.TaskStatus = importer.StatusAborted.String()
		err1 := importer.GetTaskMgr().AbortTask(taskID)
		if err != nil {
			zap.L().Warn("finish task fail", zap.Error(err1))
		}
		zap.L().Error(fmt.Sprintf("Failed to start a import task: `%s`, task result: `%v`", taskID, err))
		return nil, err
	}

	// write taskId to file
	muTaskId.Lock()
	taskIDBytes, err := ioutil.ReadFile(Config.Cfg.Web.TaskIdPath)
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
		return nil, err
	}
	taskIdJSON := make(map[string]bool)
	if len(taskIDBytes) != 0 {
		if err := json.Unmarshal(taskIDBytes, &taskIdJSON); err != nil {
			zap.L().Warn("read taskId file error", zap.Error(err))
			return nil, err
		}
	}
	taskIdJSON[taskID] = true
	bytes, err := json.Marshal(taskIdJSON)
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
	}
	err = ioutil.WriteFile(Config.Cfg.Web.TaskIdPath, bytes, 777)
	if err != nil {
		zap.L().Warn("write taskId file error", zap.Error(err))
	}
	defer muTaskId.Unlock()

	return &types.CreateImportTaskData{
		Id: taskID,
	}, nil
}

func (i *importService) StopImportTask(req *types.StopImportTaskRequest) error {
	return importer.StopImportTask(req.Id, req.Address+":"+req.Port, req.Username)
}

func (i *importService) DownloadConfig(req *types.DownloadConfigsRequest) (*types.DownloadConfigsData, error) {
	if req.Id == "" {
		return nil, errors.New("invalid Id")
	}
	configPath := filepath.Join(Config.Cfg.Web.TasksDir, req.Id, "config.yaml")
	body, err := ioutil.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	data := &types.DownloadConfigsData{}
	data.Data = string(body[:])

	return data, nil
}

func (i *importService) DownloadLogs(req *types.DownloadLogsRequest) (*types.DownloadLogsData, error) {
	id := req.Id
	if id == "" {
		return nil, errors.New("id parse failed")
	}
	filename := req.Name
	path := ""
	if filename == "import.log" {
		path = filepath.Join(Config.Cfg.Web.TasksDir, id, filename)
	} else {
		path = filepath.Join(Config.Cfg.Web.TasksDir, id, "err", filename)
	}

	fmt.Println("Path:", path)
	body, err := ioutil.ReadFile(path)

	if err != nil {
		return nil, err
	}

	data := &types.DownloadLogsData{}
	data.Data = string(body[:])

	return data, nil
}

func (i *importService) DeleteImportTask(req *types.DeleteImportTaskRequest) error {
	return importer.DeleteImportTask(req.Id, req.Address+":"+req.Port, req.Username)
}

func (i *importService) GetImportTask(req *types.GetImportTaskRequest) (*types.GetImportTaskData, error) {
	return importer.GetImportTask(req.Id, req.Address+":"+req.Port, req.Username)
}

func (i *importService) GetManyImportTask(req *types.GetManyImportTaskRequest) (*types.GetManyImportTaskData, error) {
	return importer.GetManyImportTask(req.Address+":"+req.Port, req.Username, req.Page, req.PageSize)
}

// GetImportTaskLogNames :Get all log file's name of a task
func (i *importService) GetImportTaskLogNames(req *types.GetImportTaskLogNamesRequest) (*types.GetImportTaskLogNamesData, error) {
	id := req.Id
	if id == "" {
		return nil, errors.New("id parse failed")
	}

	errLogDir := filepath.Join(Config.Cfg.Web.TasksDir, id, "err")
	fileInfos, err := ioutil.ReadDir(errLogDir)
	if err != nil {
		return nil, err
	}

	data := &types.GetImportTaskLogNamesData{
		Names: []string{},
	}
	data.Names = append(data.Names, "import.log")
	for _, fileInfo := range fileInfos {
		name := fileInfo.Name()
		data.Names = append(data.Names, name)
	}
	return data, nil
}

func (i *importService) GetManyImportTaskLog(req *types.GetManyImportTaskLogRequest) (*types.GetManyImportTaskLogData, error) {
	path := ""
	if req.File == importLogName {
		path = filepath.Join(Config.Cfg.Web.TasksDir, req.Id, req.File)
	} else {
		path = filepath.Join(Config.Cfg.Web.TasksDir, req.Id, errContentDir, req.File)
	}
	lines, err := readFile(path, req.Offset, req.Limit)
	if err != nil {
		return nil, err
	}

	muTaskId.RLock()
	taskIdBytes, err := ioutil.ReadFile(Config.Cfg.Web.TaskIdPath)
	muTaskId.RUnlock()
	if err != nil {
		zap.L().Warn("read taskId file error", zap.Error(err))
		return nil, err
	}
	taskIdJSON := make(map[string]bool)
	if len(taskIdBytes) != 0 {
		err = json.Unmarshal(taskIdBytes, &taskIdJSON)
		if err != nil {
			zap.L().Warn("parse taskId file error", zap.Error(err))
			return nil, err
		}
	}

	if len(lines) == 0 && taskIdJSON[req.Id] {
		return nil, nil
	}
	if len(lines) == 0 {
		return nil, errors.New("no task")
	}

	data := &types.GetManyImportTaskLogData{
		Logs: lines,
	}

	return data, nil
}

func validClientParams(conf *importconfig.YAMLConfig) error {
	if conf.NebulaClientSettings.Connection == nil ||
		conf.NebulaClientSettings.Connection.Address == nil ||
		*conf.NebulaClientSettings.Connection.Address == "" ||
		conf.NebulaClientSettings.Connection.User == nil ||
		*conf.NebulaClientSettings.Connection.User == "" ||
		conf.NebulaClientSettings.Space == nil ||
		*conf.NebulaClientSettings.Space == "" {
		return errors.New("client params is wrong")
	}

	for _, fn := range conf.Files {
		if fn.CSV.Delimiter == nil || *fn.CSV.Delimiter == "" {
			delimiter := ","
			fn.CSV.Delimiter = &delimiter
		}
	}

	return nil
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
