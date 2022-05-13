package importtask

import (
	"context"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteImportTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteImportTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DeleteImportTaskLogic {
	return &DeleteImportTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteImportTaskLogic) DeleteImportTask(req types.DeleteImportTaskRequest) error {
	return service.NewImportService(l.ctx, l.svcCtx).DeleteImportTask(&req)
}
