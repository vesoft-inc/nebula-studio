package datasource

import (
	"context"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourceAddLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourceAddLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceAddLogic {
	return DatasourceAddLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourceAddLogic) DatasourceAdd(req types.DatasourceAddRequest) (resp *types.DatasourceAddData, err error) {
	return service.NewDatasourceService(l.ctx, l.svcCtx).Add(req)
}
