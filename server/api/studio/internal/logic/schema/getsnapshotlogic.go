package schema

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type GetSnapshotLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGetSnapshotLogic(ctx context.Context, svcCtx *svc.ServiceContext) GetSnapshotLogic {
	return GetSnapshotLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *GetSnapshotLogic) GetSnapshot(req types.GetSchemaSnapshotRequest) (resp *types.SchemaSnapshot, err error) {
	return service.NewSchemaService(l.ctx, l.svcCtx).GetSchemaSnapshot(req)
}
