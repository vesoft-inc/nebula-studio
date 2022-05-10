package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

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
	// todo: add your logic here and delete this line

	return nil
}
