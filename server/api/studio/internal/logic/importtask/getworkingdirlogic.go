package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetWorkingDirLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetWorkingDirLogic(ctx context.Context, svcCtx *svc.ServiceContext) GetWorkingDirLogic {
	return GetWorkingDirLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetWorkingDirLogic) GetWorkingDir() (resp *types.GetWorkingDirResult, err error) {
	return service.NewImportService(l.ctx, l.svcCtx).GetWorkingDir()
}
