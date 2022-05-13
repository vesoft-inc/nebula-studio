package gateway

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type BatchExecNGQLLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewBatchExecNGQLLogic(ctx context.Context, svcCtx *svc.ServiceContext) BatchExecNGQLLogic {
	return BatchExecNGQLLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *BatchExecNGQLLogic) BatchExecNGQL(req types.BatchExecNGQLParams) (*types.AnyResponse, error) {
	return service.NewGatewayService(l.ctx, l.svcCtx).BatchExecNGQL(&req)
}
