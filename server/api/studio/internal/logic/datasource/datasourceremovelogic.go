package datasource

import (
	"context"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourceRemoveLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourceRemoveLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceRemoveLogic {
	return DatasourceRemoveLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourceRemoveLogic) DatasourceRemove(req types.DatasourceRemoveRequest) error {
	return service.NewDatasourceService(l.ctx, l.svcCtx).Remove(req)
}
