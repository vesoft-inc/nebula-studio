package llm

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/llm"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetLLMImportJobsLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetLLMImportJobsLogic(ctx context.Context, svcCtx *svc.ServiceContext) GetLLMImportJobsLogic {
	return GetLLMImportJobsLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetLLMImportJobsLogic) GetLLMImportJobs(req types.LLMImportJobsRequest) (resp *types.LLMResponse, err error) {
	return llm.NewLLMService(l.ctx, l.svcCtx).GetLLMImportJobs(&req)
}
