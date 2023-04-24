package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateTaskDraftLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewCreateTaskDraftLogic(ctx context.Context, svcCtx *svc.ServiceContext) CreateTaskDraftLogic {
	return CreateTaskDraftLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *CreateTaskDraftLogic) CreateTaskDraft(req types.CreateTaskDraftRequest) error {
	return service.NewImportService(l.ctx, l.svcCtx).CreateTaskDraft(&req)
}
