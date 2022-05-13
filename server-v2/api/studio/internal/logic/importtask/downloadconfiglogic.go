package importtask

import (
	"context"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DownloadConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDownloadConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DownloadConfigLogic {
	return &DownloadConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DownloadConfigLogic) DownloadConfig(req types.DownloadConfigsRequest) (resp *types.DownloadConfigsData, err error) {
	return service.NewImportService(l.ctx, l.svcCtx).DownloadConfig(&req)
}
