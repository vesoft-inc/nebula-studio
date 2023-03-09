package datasource

import (
	"context"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourceListContentsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourceListContentsLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceListContentsLogic {
	return DatasourceListContentsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourceListContentsLogic) DatasourceListContents(req types.DatasourceListContentsRequest) (resp *types.DatasourceListContentsData, err error) {
	return service.NewDatasourceService(l.ctx, l.svcCtx).ListContents(req)
}
