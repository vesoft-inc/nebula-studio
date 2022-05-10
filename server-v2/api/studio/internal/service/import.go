package service

import (
	"context"
	"errors"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	Config "github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/config"
	"github.com/zeromicro/go-zero/core/logx"
	"io"
	"io/ioutil"
	"path/filepath"
)

var (
	_ ImportService = (*importService)(nil)
)

const (
	importLogName = "import.log"
	errContentDir = "err"
)

type (
	ImportService interface {
		CreateImportTask(*types.CreateImportTaskRequest) (*types.CreateImportTaskData, error)
		DownloadConfig(*types.DownloadConfigsRequest) error
		DeleteImportTask(*types.DeleteImportTaskRequest) error
	}

	importService struct {
		logx.Logger
		ctx    context.Context
		svcCtx *svc.ServiceContext
		w      io.Writer
	}
)

func NewImportService(ctx context.Context, svcCtx *svc.ServiceContext, w io.Writer) ImportService {
	return &importService{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		w:      w,
	}
}

func (i *importService) CreateImportTask(req *types.CreateImportTaskRequest) (*types.CreateImportTaskData, error) {
	//config := &importconfig.YAMLConfig{
	//	Version:     &req.Config.Version,
	//	Description: &req.Config.Description,
	//}
	return nil, nil
}

func (i *importService) DownloadConfig(req *types.DownloadConfigsRequest) error {
	if req.Id == "" {
		return errors.New("Invalid Id")
	}
	configPath := filepath.Join(Config.Cfg.Web.TasksDir, req.Id, "config.yaml")
	body, err := ioutil.ReadFile(configPath)
	if err != nil {
		return err
	}

	n, err := i.w.Write(body)
	if err != nil {
		return err
	}

	if n < len(body) {
		return io.ErrClosedPipe
	}
	return nil
}

func (i *importService) DeleteImportTask(req *types.DeleteImportTaskRequest) error {

	return nil
}

func (i *importService) validClientParams(req *types.CreateImportTaskRequest) error {
	if req.Config.ClientSettings.Connection.Address == "" ||
		req.Config.ClientSettings.Connection.User == "" ||
		req.Config.ClientSettings.Connection.Password == "" {
		return errors.New("client params is wrong")
	}
	return nil
}
