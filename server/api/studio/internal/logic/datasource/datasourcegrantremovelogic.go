package datasource

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourceGrantRemoveLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourceGrantRemoveLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceGrantRemoveLogic {
	return DatasourceGrantRemoveLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourceGrantRemoveLogic) DatasourceGrantRemove(req types.DatasourceGrantRemoveRequest) error {
	return service.NewDatasourceService(l.ctx, l.svcCtx).RemoveGrants(req)
}
