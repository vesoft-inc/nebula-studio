package llm

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/llm"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type LLMConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLLMConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) LLMConfigLogic {
	return LLMConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *LLMConfigLogic) LLMConfig(req types.LLMConfigRequest) error {
	return llm.NewLLMService(l.ctx, l.svcCtx).LLMConfig(&req)
}
