package sketches

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type InitLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewInitLogic(ctx context.Context, svcCtx *svc.ServiceContext) InitLogic {
	return InitLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *InitLogic) Init(req types.InitSketchRequest) (resp *types.SketchIDResult, err error) {
	return service.NewSketchService(l.ctx, l.svcCtx).Init(req)
}
