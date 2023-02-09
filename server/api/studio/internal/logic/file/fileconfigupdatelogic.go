package file

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type FileConfigUpdateLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewFileConfigUpdateLogic(ctx context.Context, svcCtx *svc.ServiceContext) FileConfigUpdateLogic {
	return FileConfigUpdateLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *FileConfigUpdateLogic) FileConfigUpdate(req types.FileConfigUpdateRequest) error {
	return service.NewFileService(l.ctx, l.svcCtx).FileConfigUpdate(req)
}
