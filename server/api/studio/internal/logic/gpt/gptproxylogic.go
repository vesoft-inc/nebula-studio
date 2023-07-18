package gpt

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GPTProxyLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGPTProxyLogic(ctx context.Context, svcCtx *svc.ServiceContext) GPTProxyLogic {
	return GPTProxyLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GPTProxyLogic) GPTProxy(req types.GPTRequest) (resp *types.GPTResponse, err error) {
	return service.NewGPTService(l.ctx, l.svcCtx).GPTProxy(&req)
}
