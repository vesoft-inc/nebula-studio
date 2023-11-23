package llm

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetLLMImportJobLogLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetLLMImportJobLogLogic(ctx context.Context, svcCtx *svc.ServiceContext) GetLLMImportJobLogLogic {
	return GetLLMImportJobLogLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetLLMImportJobLogLogic) GetLLMImportJobLog(req types.LLMImportLogRequest) (resp *types.LLMResponse, err error) {
	// todo: add your logic here and delete this line

	return
}
