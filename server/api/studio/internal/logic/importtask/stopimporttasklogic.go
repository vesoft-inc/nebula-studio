package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type StopImportTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewStopImportTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *StopImportTaskLogic {
	return &StopImportTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *StopImportTaskLogic) StopImportTask(req types.StopImportTaskRequest) error {
	return service.NewImportService(l.ctx, l.svcCtx).StopImportTask(&req)
}
