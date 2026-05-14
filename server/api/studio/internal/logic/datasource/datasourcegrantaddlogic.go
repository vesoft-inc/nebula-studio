package datasource

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourceGrantAddLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourceGrantAddLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceGrantAddLogic {
	return DatasourceGrantAddLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourceGrantAddLogic) DatasourceGrantAdd(req types.DatasourceGrantAddRequest) error {
	return service.NewDatasourceService(l.ctx, l.svcCtx).AddGrants(req)
}
