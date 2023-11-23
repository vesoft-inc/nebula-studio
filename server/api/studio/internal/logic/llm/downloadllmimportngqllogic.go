package llm

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DownloadLLMImportNgqlLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDownloadLLMImportNgqlLogic(ctx context.Context, svcCtx *svc.ServiceContext) DownloadLLMImportNgqlLogic {
	return DownloadLLMImportNgqlLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DownloadLLMImportNgqlLogic) DownloadLLMImportNgql(req types.DownloadLLMImportNgqlRequest) (resp *types.LLMResponse, err error) {
	// todo: add your logic here and delete this line

	return
}
