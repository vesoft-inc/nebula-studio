package gpt

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetGPTConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetGPTConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) GetGPTConfigLogic {
	return GetGPTConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetGPTConfigLogic) GetGPTConfig() (resp *types.GPTConfigRequest, err error) {
	return service.NewGPTService(l.ctx, l.svcCtx).GetGPTConfig()
}
