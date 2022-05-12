package service

import (
	"context"

	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"

	"github.com/zeromicro/go-zero/core/logx"
)

var _ GatewayService = (*gatewayService)(nil)

type (
	GatewayService interface {
		ExecNGQL(request *types.ExecNGQLParams) (*types.AnyResponse, error)
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

func (s *gatewayService) ConnectDB(request *types.ConnectDBParams) (*types.ConnectDBResult, error) {
	return &types.ConnectDBResult{
		Version: string(request.NebulaVersion),
	}, nil
}

func (s *gatewayService) DisconnectDB(request *types.DisconnectDBParams) (*types.AnyResponse, error) {
	if request.NSID != "" {
		dao.Disconnect(request.NSID)
	}
	return nil, nil
}

func (s *gatewayService) ExecNGQL(request *types.ExecNGQLParams) (*types.AnyResponse, error) {
	execute, _, err := dao.Execute(request.NSID, request.Gql, request.ParamList)
	if err != nil {
		return nil, ecode.WithCode(ecode.ErrInternalServer, err, "exec failed")
	}
	return &types.AnyResponse{Data: execute}, nil
}
