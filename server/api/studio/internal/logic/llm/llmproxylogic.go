package llm

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/llm"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type LLMProxyLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLLMProxyLogic(ctx context.Context, svcCtx *svc.ServiceContext) LLMProxyLogic {
	return LLMProxyLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LLMProxyLogic) LLMProxy(req types.LLMRequest) (resp *types.LLMResponse, err error) {
	return llm.NewLLMService(l.ctx, l.svcCtx).LLMProxy(&req)
}
