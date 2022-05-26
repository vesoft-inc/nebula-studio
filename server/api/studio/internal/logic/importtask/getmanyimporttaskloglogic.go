package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetManyImportTaskLogLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetManyImportTaskLogLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetManyImportTaskLogLogic {
	return &GetManyImportTaskLogLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetManyImportTaskLogLogic) GetManyImportTaskLog(req types.GetManyImportTaskLogRequest) (resp *types.GetManyImportTaskLogData, err error) {
	return service.NewImportService(l.ctx, l.svcCtx).GetManyImportTaskLog(&req)
}
