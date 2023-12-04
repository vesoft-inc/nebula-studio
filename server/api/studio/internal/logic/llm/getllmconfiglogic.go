package llm

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/llm"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetLLMConfigLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetLLMConfigLogic(ctx context.Context, svcCtx *svc.ServiceContext) GetLLMConfigLogic {
	return GetLLMConfigLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetLLMConfigLogic) GetLLMConfig() (resp *types.LLMResponse, err error) {
	return llm.NewLLMService(l.ctx, l.svcCtx).GetLLMConfig()
}
