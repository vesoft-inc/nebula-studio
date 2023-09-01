package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/nebula-importer/v4/pkg/config"
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
		CreateTaskDraft(*types.CreateTaskDraftRequest) error
		UpdateTaskDraft(*types.UpdateTaskDraftRequest) error
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
		ctx              context.Context
		svcCtx           *svc.ServiceContext
		gormErrorWrapper utils.GormErrorWrapper
	}
)

func NewImportService(ctx context.Context, svcCtx *svc.ServiceContext) ImportService {
	return &importService{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (i *importService) updateDatasourceConfig(conf *types.CreateImportTaskRequest) (*types.ImportTaskConfig, error) {
	var config types.ImportTaskConfig
	if err := json.Unmarshal([]byte(conf.Config), &config); err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, err)
	}
	for _, source := range config.Sources {
		if source.DatasourceId != nil {
			var dbs db.Datasource
			result := db.CtxDB.Where("b_id = ?", source.DatasourceId).First(&dbs)
			if result.Error != nil {
				return nil, i.gormErrorWrapper(result.Error)
			}
			if result.RowsAffected == 0 {
				return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, nil, "datasource don't exist")
			}

			secret, err := utils.Decrypt(dbs.Secret, []byte(cipher))
			if err != nil {
				return nil, err
			}
			switch dbs.Type {
			case "s3":
				cfg := &types.DatasourceS3Config{}
				jsonConfig := dbs.Config
				if err := json.Unmarshal([]byte(jsonConfig), cfg); err != nil {
					return nil, ecode.WithInternalServer(err, "get datasource config failed")
				}
				switch dbs.Platform {
				case "aws":
					// endpoint is not required in importer aws config
					// some format of endpoint will cause error, for example: https://s3.amazonaws.com
					source.S3 = &types.S3Config{
						AccessKeyID:     cfg.AccessKeyID,
						AccessKeySecret: string(secret),
						Bucket:          cfg.Bucket,
						Region:          cfg.Region,
						Key:             *source.DatasourceFilePath,
					}
				case "oss":
					source.OSS = &types.OSSConfig{
						AccessKeyID:     cfg.AccessKeyID,
						AccessKeySecret: string(secret),
						Bucket:          cfg.Bucket,
						Endpoint:        cfg.Endpoint,
						Key:             *source.DatasourceFilePath,
					}
				case "cos", "customize":
					source.S3 = &types.S3Config{
						AccessKeyID:     cfg.AccessKeyID,
						AccessKeySecret: string(secret),
						Bucket:          cfg.Bucket,
						Region:          cfg.Region,
						Endpoint:        cfg.Endpoint,
						Key:             *source.DatasourceFilePath,
					}
					if cfg.Region == "" {
						source.S3.Region = "us-east-1"
					}
				}
			case "sftp":
				sftpConfig := &types.DatasourceSFTPConfig{}
				jsonConfig := dbs.Config
				if err := json.Unmarshal([]byte(jsonConfig), sftpConfig); err != nil {
					return nil, ecode.WithInternalServer(err, "get datasource config failed")
				}
				source.SFTP = &types.SFTPConfig{
					Host:     sftpConfig.Host,
					Port:     sftpConfig.Port,
					User:     sftpConfig.Username,
					Password: string(secret),
					Path:     *source.DatasourceFilePath,
				}
			}
		}
	}
	return &config, nil
}
func updateConfig(conf config.Configurator, taskDir, uploadDir string) {
	confv3 := conf.(*configv3.Config)
	if confv3.Log == nil {
		confv3.Log = &config.Log{}
		confv3.Log.Files = make([]string, 0)
	}

	confv3.Log.Files = append(confv3.Log.Files, filepath.Join(taskDir, importLogName))
	for _, source := range confv3.Sources {
		if source.SourceConfig.Local != nil {
			source.SourceConfig.Local.Path = filepath.Join(uploadDir, source.SourceConfig.Local.Path)
		}
	}
}

func (i *importService) CreateImportTask(req *types.CreateImportTaskRequest) (*types.CreateImportTaskData, error) {
	_config, err := i.updateDatasourceConfig(req)

	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	jsons, err := json.Marshal(_config)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrParam, err)
	}
	conf, err := config.FromBytes(jsons)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	// create task dir
	id := req.Id
	if id == nil {
		newId := i.svcCtx.IDGenerator.Generate()
		id = &newId
	}
	taskDir, err := importer.CreateNewTaskDir(i.svcCtx.Config.File.TasksDir, *id)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	// create config file
	if err := importer.CreateConfigFile(taskDir, jsons); err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	// modify source file path & add log config
	updateConfig(conf, taskDir, i.svcCtx.Config.File.UploadDir)

	// init task in db
	auth := i.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	taskMgr := importer.GetTaskMgr()
	var task *importer.Task
	if req.Id != nil {
		task, err = taskMgr.TurnDraftToTask(*req.Id, req.Name, req.RawConfig, conf)
	} else {
		task, err = taskMgr.NewTask(*id, host, auth.Username, req.Name, req.RawConfig, conf)
	}
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	// start import
	if err = importer.StartImport(*id); err != nil {
		task.TaskInfo.TaskStatus = importer.Aborted.String()
		task.TaskInfo.TaskMessage = err.Error()
		importer.GetTaskMgr().AbortTask(*id)
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	return &types.CreateImportTaskData{
		Id: *id,
	}, nil
}

func (i *importService) CreateTaskDraft(req *types.CreateTaskDraftRequest) error {
	auth := i.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	taskMgr := importer.GetTaskMgr()
	id := i.svcCtx.IDGenerator.Generate()
	err := taskMgr.NewTaskDraft(id, host, auth.Username, req.Name, req.Space, req.RawConfig)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return nil
}

func (i *importService) UpdateTaskDraft(req *types.UpdateTaskDraftRequest) error {
	taskMgr := importer.GetTaskMgr()
	err := taskMgr.UpdateTaskDraft(*req.Id, req.Name, req.Space, req.RawConfig)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return nil
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
	return importer.GetImportTask(req.Id, host, auth.Username)
}

func (i *importService) GetManyImportTask(req *types.GetManyImportTaskRequest) (*types.GetManyImportTaskData, error) {
	auth := i.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := fmt.Sprintf("%s:%d", auth.Address, auth.Port)
	return importer.GetManyImportTask(host, auth.Username, req.Page, req.PageSize)
}

// GetImportTaskLogNames :Get all log file's name of a task
func (i *importService) GetImportTaskLogNames(req *types.GetImportTaskLogNamesRequest) (*types.GetImportTaskLogNamesData, error) {
	// TODO err log will be support in next importer version
	// id := req.Id

	// errLogDir := filepath.Join(i.svcCtx.Config.File.TasksDir, strconv.Itoa(id), "err")
	// fileInfos, err := ioutil.ReadDir(errLogDir)
	// if err != nil {
	// 	return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	// }

	data := &types.GetImportTaskLogNamesData{
		Names: []string{},
	}
	data.Names = append(data.Names, importLogName)
	// for _, fileInfo := range fileInfos {
	// 	name := fileInfo.Name()
	// 	data.Names = append(data.Names, name)
	// }
	return data, nil
}

func (i *importService) GetManyImportTaskLog(req *types.GetManyImportTaskLogRequest) (*types.GetManyImportTaskLogData, error) {
	path := ""
	if req.File == importLogName {
		path = filepath.Join(i.svcCtx.Config.File.TasksDir, req.Id, req.File)
	} else {
		path = filepath.Join(i.svcCtx.Config.File.TasksDir, req.Id, errContentDir, req.File)
	}
	lines, endPosition, err := readFile(path, req.Start, req.End)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}

	data := &types.GetManyImportTaskLogData{
		Logs:        lines,
		EndPosition: endPosition,
	}
	return data, nil
}

func (i *importService) GetWorkingDir() (*types.GetWorkingDirResult, error) {
	return &types.GetWorkingDirResult{
		TaskDir:   i.svcCtx.Config.File.TasksDir,
		UploadDir: i.svcCtx.Config.File.UploadDir,
	}, nil
}

func readFile(path string, start int64, end int64) (string, int64, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", 0, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	defer file.Close()
	fileInfo, err := file.Stat()
	if err != nil {
		return "", 0, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	if start > fileInfo.Size() {
		return "", 0, nil
	}
	if end == 0 || end > fileInfo.Size() {
		end = fileInfo.Size()
	}
	bytes := make([]byte, end-start)
	_, err = file.ReadAt(bytes, start)
	if err != nil {
		return "", 0, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return string(bytes), end, nil
}
