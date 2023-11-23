package datasource

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourcePreviewFileLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourcePreviewFileLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourcePreviewFileLogic {
	return DatasourcePreviewFileLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourcePreviewFileLogic) DatasourcePreviewFile(req types.DatasourcePreviewFileRequest) (resp *types.DatasourcePreviewFileData, err error) {
	return service.NewDatasourceService(l.ctx, l.svcCtx).PreviewFile(req)
}
