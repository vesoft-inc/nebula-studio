package gateway

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ExecNGQLLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewExecNGQLLogic(ctx context.Context, svcCtx *svc.ServiceContext) ExecNGQLLogic {
	return ExecNGQLLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ExecNGQLLogic) ExecNGQL(req types.ExecNGQLParams) (resp *types.AnyResponse, err error) {
	return service.NewGatewayService(l.ctx, l.svcCtx).ExecNGQL(&req)
}
