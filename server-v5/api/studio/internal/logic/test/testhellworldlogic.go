package test

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/service"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type TestHellworldLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewTestHellworldLogic(ctx context.Context, svcCtx *svc.ServiceContext) *TestHellworldLogic {
	return &TestHellworldLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *TestHellworldLogic) TestHellworld() (resp *types.GetTestResp, err error) {
	return service.NewTestService(l.ctx, l.svcCtx).Get()
}
