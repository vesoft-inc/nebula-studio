package service

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

var _ TestService = (*testService)(nil)

type (
	TestService interface {
		Get() (*types.GetTestResp, error)
	}

	testService struct {
		logx.Logger
		ctx    context.Context
		svcCtx *svc.ServiceContext
	}
)

func NewTestService(ctx context.Context, svcCtx *svc.ServiceContext) TestService {
	return &testService{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (*testService) Get() (*types.GetTestResp, error) {
	return &types.GetTestResp{Data: "hello world"}, nil
}
