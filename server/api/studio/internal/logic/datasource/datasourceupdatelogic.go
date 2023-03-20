package datasource

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DatasourceUpdateLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDatasourceUpdateLogic(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceUpdateLogic {
	return DatasourceUpdateLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DatasourceUpdateLogic) DatasourceUpdate(req types.DatasourceUpdateRequest) error {
	return service.NewDatasourceService(l.ctx, l.svcCtx).Update(req)

}
