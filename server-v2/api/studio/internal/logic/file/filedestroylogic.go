package file

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type FileDestroyLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewFileDestroyLogic(ctx context.Context, svcCtx *svc.ServiceContext) *FileDestroyLogic {
	return &FileDestroyLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *FileDestroyLogic) FileDestroy(req types.FileDestroyRequest) error {
	return service.NewFileService(l.ctx, l.svcCtx).FileDestroy(req.Name)
}
