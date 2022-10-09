package gateway

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type ExecSeqNGQLLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewExecSeqNGQLLogic(ctx context.Context, svcCtx *svc.ServiceContext) ExecSeqNGQLLogic {
	return ExecSeqNGQLLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *ExecSeqNGQLLogic) ExecSeqNGQL(req types.ExecNGQLParams) (resp *types.ExecSeqNGQLResult, err error) {
	return service.NewGatewayService(l.ctx, l.svcCtx).ExecSeqNGQL(&req)
}
