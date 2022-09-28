package favorite

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/zeromicro/go-zero/core/logx"
)

type DeleteAllLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewDeleteAllLogic(ctx context.Context, svcCtx *svc.ServiceContext) DeleteAllLogic {
	return DeleteAllLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *DeleteAllLogic) DeleteAll() error {
	return service.NewFavoriteService(l.ctx, l.svcCtx).DeleteAll()
}
