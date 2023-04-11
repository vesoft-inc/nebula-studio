package service

import (
	"context"
	"net/http"
	"time"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/go-pkg/response"
	nebula "github.com/vesoft-inc/nebula-go/v3"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/client"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

// set the timeout for the graph service: 8 hours
// once the timeout is reached, the connection will be closed
// all requests running ngql will be failed, so keepping a long timeout is necessary, make the connection alive
const GraphServiceTimeout = 8 * time.Hour

var _ GatewayService = (*gatewayService)(nil)

type (
	GatewayService interface {
		ExecNGQL(request *types.ExecNGQLParams) (*types.AnyResponse, error)
		BatchExecNGQL(request *types.BatchExecNGQLParams) (*types.AnyResponse, error)
		ConnectDB(request *types.ConnectDBParams) error
		DisconnectDB() (*types.AnyResponse, error)
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

func (s *gatewayService) ConnectDB(request *types.ConnectDBParams) error {
	httpRes, _ := middleware.GetResponseWriter(s.ctx)

	// tokenString, err := auth.ParseConnectDBParams(request, &s.svcCtx.Config)
	username, password, err := auth.ParseConnectDBParams(request, &s.svcCtx.Config)
	if err != nil {
		return s.withErrorMessage(ecode.ErrBadRequest, err)
	}
	address := request.Address
	port := request.Port
	// set Graph Service connect timeout 8h, which is 0s default(means no timeout)
	poolCfg := nebula.GetDefaultConf()
	poolCfg.TimeOut = GraphServiceTimeout
	poolCfg.MaxConnPoolSize = 200
	clientInfo, err := client.NewClient(address, port, username, password, poolCfg)
	if err != nil {
		return s.withErrorMessage(ecode.ErrBadRequest, err, "connect to nebula failed")
	}
	tokenString, err := auth.CreateToken(
		&auth.AuthData{
			Address:  address,
			Port:     port,
			Username: username,
			Password: password,
			NSID:     clientInfo.ClientID,
		},
		&s.svcCtx.Config,
	)

	if err != nil {
		return s.withErrorMessage(ecode.ErrBadRequest, err, "parse request failed")
	}

	configAuth := s.svcCtx.Config.Auth
	tokenCookie := http.Cookie{
		Name:     configAuth.TokenName,
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   int(configAuth.AccessExpire),
	}

	httpsEnable := s.svcCtx.Config.CertFile != "" && s.svcCtx.Config.KeyFile != ""
	if httpsEnable {
		tokenCookie.Secure = true
		tokenCookie.SameSite = http.SameSiteNoneMode
	}

	httpRes.Header().Add("Set-Cookie", tokenCookie.String())

	return nil
}

func (s *gatewayService) DisconnectDB() (*types.AnyResponse, error) {
	authData, ok := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	if ok && authData.NSID != "" {
		client.CloseClient(authData.NSID)
	}

	httpRes, _ := middleware.GetResponseWriter(s.ctx)
	configAuth := s.svcCtx.Config.Auth
	httpsEnable := s.svcCtx.Config.CertFile != "" && s.svcCtx.Config.KeyFile != ""
	httpRes.Header().Set("Set-Cookie", utils.DisabledCookie(configAuth.TokenName, httpsEnable).String())

	return &types.AnyResponse{Data: response.StandardHandlerDataFieldAny(nil)}, nil
}

func transformError(err error) error {
	if auth.IsSessionError(err) {
		return ecode.WithSessionMessage(err)
	}
	return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "execute failed")
}

func (s *gatewayService) ExecNGQL(request *types.ExecNGQLParams) (*types.AnyResponse, error) {
	authData := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	var gqls []string
	gqls = append(gqls, request.Gql)
	executes, err := client.Execute(authData.NSID, request.Space, gqls)
	if err != nil {
		return nil, transformError(err)
	}
	res := executes[0]
	if res.Error != nil {
		return nil, transformError(res.Error)
	}
	return &types.AnyResponse{Data: response.StandardHandlerDataFieldAny(res.Result)}, nil
}

func (s *gatewayService) BatchExecNGQL(request *types.BatchExecNGQLParams) (*types.AnyResponse, error) {
	authData := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)

	NSID := authData.NSID
	gqls := request.Gqls

	data := make([]map[string]interface{}, 0)
	executes, err := client.Execute(NSID, request.Space, gqls)
	if err != nil {
		return nil, transformError(err)
	}
	for _, res := range executes {
		gqlRes := map[string]interface{}{"gql": res.Gql, "data": res.Result}
		if res.Error != nil {
			gqlRes["message"] = res.Error.Error()
			gqlRes["code"] = base.Error
		} else {
			gqlRes["code"] = base.Success
		}
		data = append(data, gqlRes)
	}

	return &types.AnyResponse{Data: response.StandardHandlerDataFieldAny(data)}, nil
}
