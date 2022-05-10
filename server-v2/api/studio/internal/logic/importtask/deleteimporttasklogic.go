package importtask

import (
	"context"
	"io"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteImportTaskLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
	writer io.Writer
}

func NewDeleteImportTaskLogic(ctx context.Context, svcCtx *svc.ServiceContext, w io.Writer) *DeleteImportTaskLogic {
	return &DeleteImportTaskLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
		writer: w,
	}
}

func (l *DeleteImportTaskLogic) DeleteImportTask(req types.DeleteImportTaskRequest) error {
	// todo: add your logic here and delete this line

	return nil
}
