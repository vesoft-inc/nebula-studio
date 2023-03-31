package datasource

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourceBatchRemoveLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourceBatchRemoveLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceBatchRemoveLogic {
	return DatasourceBatchRemoveLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourceBatchRemoveLogic) DatasourceBatchRemove(req types.DatasourceBatchRemoveRequest) error {
	return service.NewDatasourceService(l.ctx, l.svcCtx).BatchRemove(req)
}
