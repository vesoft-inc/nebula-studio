package importtask

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type UpdateTaskDraftLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewUpdateTaskDraftLogic(ctx context.Context, svcCtx *svc.ServiceContext) UpdateTaskDraftLogic {
	return UpdateTaskDraftLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *UpdateTaskDraftLogic) UpdateTaskDraft(req types.UpdateTaskDraftRequest) error {
	return service.NewImportService(l.ctx, l.svcCtx).UpdateTaskDraft(&req)
}
