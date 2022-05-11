package service

import (
	"context"

	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

var _ GatewayService = (*gatewayService)(nil)

type (
	GatewayService interface {
		GetExec(request *types.ExecNGQLParams) (*types.AnyResponse, error)
		ConnectDB(request *types.ConnectDBParams) (*types.ConnectDBResult, error)
		DisconnectDB(request *types.DisconnectDBParams) (*types.AnyResponse, error)
	}

	gatewayService struct {
		logx.Logger
		ctx    context.Context
		svcCtx *svc.ServiceContext
	}
)

func NewGatewayService(ctx context.Context, svcCtx *svc.ServiceContext) GatewayService {
	return &gatewayService{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (s *gatewayService) GetExec(request *types.ExecNGQLParams) (*types.AnyResponse, error) {
	return &types.AnyResponse{
		Data: map[string]any{
			"message": "ok",
		},
	}, nil
}

func (s *gatewayService) ConnectDB(request *types.ConnectDBParams) (*types.ConnectDBResult, error) {
	return &types.ConnectDBResult{
		Version: string(request.NebulaVersion),
	}, nil
}

func (s *gatewayService) DisconnectDB(request *types.DisconnectDBParams) (*types.AnyResponse, error) {
	if request.Nsid != "" {
		dao.Disconnect(request.Nsid)
	}
	return nil, nil
}
