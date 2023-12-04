package llm

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/llm"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type AddLLMImportJobLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewAddLLMImportJobLogic(ctx context.Context, svcCtx *svc.ServiceContext) AddLLMImportJobLogic {
	return AddLLMImportJobLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *AddLLMImportJobLogic) AddLLMImportJob(req types.LLMImportRequest) (resp *types.LLMResponse, err error) {
	return llm.NewLLMService(l.ctx, l.svcCtx).AddImportJob(&req)
}
