package gateway

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DisonnectLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDisonnectLogic(ctx context.Context, svcCtx *svc.ServiceContext) DisonnectLogic {
	return DisonnectLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DisonnectLogic) Disonnect() (*types.AnyResponse, error) {
	return service.NewGatewayService(l.ctx, l.svcCtx).DisconnectDB()
}
