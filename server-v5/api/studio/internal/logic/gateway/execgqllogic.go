package gateway

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ExecGQLLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewExecGQLLogic(ctx context.Context, svcCtx *svc.ServiceContext) *ExecGQLLogic {
	return &ExecGQLLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ExecGQLLogic) ExecGQL(req *types.ExecGQLParams) (resp *types.AnyResp, err error) {
	return service.NewGatewayService(l.ctx, l.svcCtx).ExecGQL(req)
}
