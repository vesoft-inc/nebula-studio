package gpt

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GPTConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGPTConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) GPTConfigLogic {
	return GPTConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GPTConfigLogic) GPTConfig(req types.GPTConfigRequest) error {
	return service.NewGPTService(l.ctx, l.svcCtx).GPTConfig(&req)
}
