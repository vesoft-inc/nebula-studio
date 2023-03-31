package datasource

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourceListLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourceListLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceListLogic {
	return DatasourceListLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourceListLogic) DatasourceList(req types.DatasourceListRequest) (resp *types.DatasourceData, err error) {
	return service.NewDatasourceService(l.ctx, l.svcCtx).List(req)
}
