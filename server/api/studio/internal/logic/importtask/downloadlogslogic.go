package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DownloadLogsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDownloadLogsLogic(ctx context.Context, svcCtx *svc.ServiceContext) *DownloadLogsLogic {
	return &DownloadLogsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DownloadLogsLogic) DownloadLogs(req types.DownloadLogsRequest) error {
	return service.NewImportService(l.ctx, l.svcCtx).DownloadLogs(&req)
}
