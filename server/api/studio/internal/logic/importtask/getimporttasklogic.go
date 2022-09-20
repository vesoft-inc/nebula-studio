package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetImportTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetImportTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetImportTaskLogic {
	return &GetImportTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetImportTaskLogic) GetImportTask(req types.GetImportTaskRequest) (resp *types.GetImportTaskData, err error) {
	return service.NewImportService(l.ctx, l.svcCtx).GetImportTask(&req)
}
