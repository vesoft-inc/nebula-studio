package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateImportTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateImportTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateImportTaskLogic {
	return &CreateImportTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateImportTaskLogic) CreateImportTask(req types.CreateImportTaskRequest) (resp *types.CreateImportTaskData, err error) {
	return service.NewImportService(l.ctx, l.svcCtx).CreateImportTask(&req)
}
