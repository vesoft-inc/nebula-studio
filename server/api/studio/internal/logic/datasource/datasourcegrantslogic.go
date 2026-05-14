package datasource

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourceGrantsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourceGrantsLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceGrantsLogic {
	return DatasourceGrantsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourceGrantsLogic) DatasourceGrants(req types.DatasourceGrantsRequest) (*types.DatasourceGrantsData, error) {
	return service.NewDatasourceService(l.ctx, l.svcCtx).ListGrants(req)
}
