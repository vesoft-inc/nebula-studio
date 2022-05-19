package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetManyImportTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetManyImportTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetManyImportTaskLogic {
	return &GetManyImportTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetManyImportTaskLogic) GetManyImportTask(req types.GetManyImportTaskRequest) (resp *types.GetManyImportTaskData, err error) {
	return service.NewImportService(l.ctx, l.svcCtx).GetManyImportTask(&req)
}
