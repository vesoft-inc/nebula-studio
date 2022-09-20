package service

import (
	"context"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

var _ HealthService = (*healthService)(nil)

type (
	HealthService interface {
		Get() (*types.GetHealth, error)
	}

	healthService struct {
		logx.Logger
		ctx    context.Context
		svcCtx *svc.ServiceContext
	}
)

func NewHealthService(ctx context.Context, svcCtx *svc.ServiceContext) HealthService {
	return &healthService{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (*healthService) Get() (*types.GetHealth, error) {
	return &types.GetHealth{
		Status: "OK",
	}, nil
}
