package file

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type FilesIndexLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewFilesIndexLogic(ctx context.Context, svcCtx *svc.ServiceContext) *FilesIndexLogic {
	return &FilesIndexLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *FilesIndexLogic) FilesIndex() (resp *types.FilesIndexData, err error) {
	return service.NewFileService(l.ctx, l.svcCtx).FilesIndex()
}
