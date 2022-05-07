package service

import (
	"context"
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"

	"github.com/zeromicro/go-zero/core/logx"
)

var _ GatewayService = (*gatewayService)(nil)

type (
	GatewayService interface {
		GetExec(request *types.ExecNGQLParams) (*types.AnyResponse, error)
		ConnectDB(request *types.ConnectDBParams) (*types.ConnectDBResult, error)
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
	fmt.Println("======request999", request)
	tokenSplit := strings.Split(request.Authorization, " ")
	if len(tokenSplit) != 2 {
		return nil, ecode.WithCode(ecode.ErrParam, nil, "invalid authorization")
	}

	decode, err := base64.StdEncoding.DecodeString(tokenSplit[1])
	if err != nil {
		return nil, ecode.WithCode(ecode.ErrParam, err)
	}

	loginInfo := strings.Split(string(decode), ":")
	if len(loginInfo) < 2 {
		return nil, ecode.WithCode(ecode.ErrParam, nil, "len of account is less than two")
	}

	username, password := loginInfo[0], loginInfo[1]
	clientInfo, err := dao.Connect(request.Address, request.Port, username, password)

	tokenString, err := auth.CreateToken(
		&auth.AuthData{
			NebulaAddress: request.Address,
			Username:      username,
			ClientID:      clientInfo.ClientID,
		},
		&s.svcCtx.Config,
	)

	fmt.Println("=====tokenString", tokenString)

	if err != nil {
		return nil, ecode.WithInternalServer(err, "connect db failed")
	}

	return &types.ConnectDBResult{
		Version: string(clientInfo.NebulaVersion),
	}, nil
}
