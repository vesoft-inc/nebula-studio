package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetImportTaskLogNamesLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetImportTaskLogNamesLogic(ctx context.Context, svcCtx *svc.ServiceContext) *GetImportTaskLogNamesLogic {
	return &GetImportTaskLogNamesLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetImportTaskLogNamesLogic) GetImportTaskLogNames(req types.GetImportTaskLogNamesRequest) (resp *types.GetImportTaskLogNamesData, err error) {
	return service.NewImportService(l.ctx, l.svcCtx).GetImportTaskLogNames(&req)
}
