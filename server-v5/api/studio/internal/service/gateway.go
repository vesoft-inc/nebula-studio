package service

import (
	"context"
	"fmt"
	"net/http"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/go-pkg/response"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/graphd"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/utils"

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
		ctx              context.Context
		svcCtx           *svc.ServiceContext
		withErrorMessage utils.WithErrorMessage
	}
)

func NewGatewayService(ctx context.Context, svcCtx *svc.ServiceContext) GatewayService {
	return &gatewayService{
		Logger:           logx.WithContext(ctx),
		ctx:              ctx,
		svcCtx:           svcCtx,
		withErrorMessage: utils.ErrMsgWithLogger(ctx),
	}
}

func (s *gatewayService) Connect(request *types.ConnectDBParams) error {
	httpRes, _ := middleware.GetResponseWriter(s.ctx)

	tokenString, err := auth.ParseConnectDBParams(request, &s.svcCtx.Config)
	if err != nil {
		return s.withErrorMessage(ecode.ErrBadRequest, err, "parse request failed")
	}

	configAuth := s.svcCtx.Config.Auth
	tokenCookie := http.Cookie{
		Name:     configAuth.TokenName,
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   int(configAuth.TokenMaxAge),
	}

	httpsEnable := s.svcCtx.Config.CertFile != "" && s.svcCtx.Config.KeyFile != ""
	if httpsEnable {
		tokenCookie.Secure = true
		tokenCookie.SameSite = http.SameSiteNoneMode
	}

	httpRes.Header().Add("Set-Cookie", tokenCookie.String())

	return nil
}

func (s *gatewayService) Disconnect() (*types.AnyResp, error) {
	httpRes, _ := middleware.GetResponseWriter(s.ctx)
	configAuth := s.svcCtx.Config.Auth
	httpsEnable := s.svcCtx.Config.CertFile != "" && s.svcCtx.Config.KeyFile != ""
	httpRes.Header().Set("Set-Cookie", utils.DisabledCookie(configAuth.TokenName, httpsEnable).String())

	return &types.AnyResp{Data: response.StandardHandlerDataFieldAny(nil)}, nil
}

func (g *gatewayService) ExecGQL(request *types.ExecGQLParams) (*types.AnyResp, error) {
	authData := g.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := fmt.Sprintf("%s:%d", authData.Address, authData.Port)
	client, err := nebula.NewNebulaClient(host, username, password)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	// gql := strconv.Quote(request.Gql)
	// gql = gql[1 : len(gql)-1]
	// gql = strings.ReplaceAll(gql, "\\n", " ")
	// gql = strings.ReplaceAll(gql, "\\t", " ")
	// gql = strings.ReplaceAll(gql, "\\r", " ")
	// gql = strings.ReplaceAll(gql, "\\\\", " ")
	// fmt.Println("=====request.Gql", request.Gql)
	// fmt.Println("=====request.gql", gql)
	resp, err := graphd.RunGql(client, request.Gql)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err, "run gql failed")
	}
	return &types.AnyResp{Data: response.StandardHandlerDataFieldAny(resp)}, nil
}
