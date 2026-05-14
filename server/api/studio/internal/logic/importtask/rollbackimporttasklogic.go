package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type RollbackImportTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewRollbackImportTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *RollbackImportTaskLogic {
	return &RollbackImportTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *RollbackImportTaskLogic) RollbackImportTask(req types.RollbackImportTaskRequest) error {
	return service.NewImportService(l.ctx, l.svcCtx).RollbackImportTask(&req)
}
