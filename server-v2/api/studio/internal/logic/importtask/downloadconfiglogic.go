package importtask

import (
	"context"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"io"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DownloadConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	writer io.Writer
}

func NewDownloadConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext, writer io.Writer) *DownloadConfigLogic {
	return &DownloadConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		writer: writer,
	}
}

func (l *DownloadConfigLogic) DownloadConfig(req types.DownloadConfigsRequest) error {
	return service.NewImportService(l.ctx, l.svcCtx, l.writer).DownloadConfig(&req)
}
