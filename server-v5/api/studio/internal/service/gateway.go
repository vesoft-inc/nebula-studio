package service

import (
	"context"
	"fmt"

	"github.com/vesoft-inc/go-pkg/response"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/graphd"

	nebula "github.com/vesoft-inc/nebula-ng-tools/golang"
	"github.com/zeromicro/go-zero/core/logx"
)

var _ GatewayService = (*gatewayService)(nil)

const (
	address  = "192.168.8.145"
	port     = 9669
	username = "root"
	password = "nebula"
)

type (
	GatewayService interface {
		Connect(req *types.ConnectDBParams) error
		Disconnect() (*types.AnyResp, error)
		ExecGQL(req *types.ExecGQLParams) (*types.AnyResp, error)
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

func (g *gatewayService) Connect(req *types.ConnectDBParams) error {
	return nil
}

func (g *gatewayService) Disconnect() (*types.AnyResp, error) {
	return &types.AnyResp{}, nil
}

func (g *gatewayService) ExecGQL(request *types.ExecGQLParams) (*types.AnyResp, error) {
	addresses := fmt.Sprintf("%s:%d", address, port)
	client, err := nebula.NewNebulaClient(addresses, username, password)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	resp, err := graphd.RunGql(client, request.Gql)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err, "run gql failed")
	}
	return &types.AnyResp{Data: response.StandardHandlerDataFieldAny(resp)}, nil
}
