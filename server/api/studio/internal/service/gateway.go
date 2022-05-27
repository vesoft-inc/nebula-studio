package service

import (
	"context"
	"net/http"
	"strings"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/pkg/base"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/pkg/utils"

	"github.com/zeromicro/go-zero/core/logx"
)

var _ GatewayService = (*gatewayService)(nil)

type (
	GatewayService interface {
		ExecNGQL(request *types.ExecNGQLParams) (*types.AnyResponse, error)
		BatchExecNGQL(request *types.BatchExecNGQLParams) (*types.AnyResponse, error)
		ConnectDB(request *types.ConnectDBParams) (*types.ConnectDBResult, error)
		DisconnectDB() (*types.AnyResponse, error)
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
	httpRes, _ := middleware.GetResponseWriter(s.ctx)

	tokenString, clientInfo, err := auth.ParseConnectDBParams(request, &s.svcCtx.Config)
	if err != nil {
		return nil, ecode.WithCode(ecode.ErrBadRequest, err, "parse request failed")
	}

	configAuth := s.svcCtx.Config.Auth
	tokenCookie := http.Cookie{
		Name:     auth.TokenName,
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   int(configAuth.AccessExpire),
	}
	NSIDCookie := http.Cookie{
		Name:     auth.NSIDName,
		Value:    clientInfo.ClientID,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   int(configAuth.AccessExpire),
	}

	httpRes.Header().Add("Set-Cookie", tokenCookie.String())
	httpRes.Header().Add("Set-Cookie", NSIDCookie.String())

	return &types.ConnectDBResult{
		Version: string(clientInfo.NebulaVersion),
	}, nil
}

func (s *gatewayService) DisconnectDB() (*types.AnyResponse, error) {
	httpReq, _ := middleware.GetRequest(s.ctx)
	httpRes, _ := middleware.GetResponseWriter(s.ctx)

	NSIDCookie, NSIDErr := httpReq.Cookie(auth.NSIDName)
	if NSIDErr == nil && NSIDCookie.Value != "" {
		dao.Disconnect(NSIDCookie.Value)
	}

	httpRes.Header().Set("Set-Cookie", utils.DisabledCookie(auth.TokenName).String())
	httpRes.Header().Add("Set-Cookie", utils.DisabledCookie(auth.NSIDName).String())

	return nil, nil
}

func (s *gatewayService) ExecNGQL(request *types.ExecNGQLParams) (*types.AnyResponse, error) {
	httpReq, _ := middleware.GetRequest(s.ctx)
	NSIDCookie, NSIDErr := httpReq.Cookie(auth.NSIDName)
	if NSIDErr != nil {
		return nil, ecode.WithSessionMessage(NSIDErr)
	}

	execute, _, err := dao.Execute(NSIDCookie.Value, request.Gql, request.ParamList)
	if err != nil {
		// TODO: common middleware should handle this
		subErrMsgStr := []string{
			"session expired",
			"connection refused",
			"broken pipe",
			"an existing connection was forcibly closed",
			"Token is expired",
		}
		for _, subErrMsg := range subErrMsgStr {
			if strings.Contains(err.Error(), subErrMsg) {
				return nil, ecode.WithSessionMessage(err)
			}
		}
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err, "execute failed")
	}

	return &types.AnyResponse{Data: execute}, nil
}

func (s *gatewayService) BatchExecNGQL(request *types.BatchExecNGQLParams) (*types.AnyResponse, error) {
	httpReq, _ := middleware.GetRequest(s.ctx)
	NSIDCookie, NSIDErr := httpReq.Cookie(auth.NSIDName)
	if NSIDErr != nil {
		return nil, ecode.WithSessionMessage(NSIDErr)
	}

	NSID := NSIDCookie.Value
	gqls := request.Gqls
	paramList := request.ParamList

	data := make([]map[string]interface{}, 0)
	for _, gql := range gqls {
		execute, _, err := dao.Execute(NSID, gql, make([]string, 0))
		gqlRes := map[string]interface{}{"gql": gql, "data": execute}
		if err != nil {
			gqlRes["message"] = err.Error()
			gqlRes["code"] = base.Error
		} else {
			gqlRes["code"] = base.Success
		}
		data = append(data, gqlRes)
	}

	if len(paramList) > 0 {
		execute, _, err := dao.Execute(NSID, "", paramList)
		gqlRes := map[string]interface{}{"gql": strings.Join(paramList, "; "), "data": execute}
		if err != nil {
			gqlRes["message"] = err.Error()
			gqlRes["code"] = base.Error
		} else {
			gqlRes["code"] = base.Success
		}
		data = append(data, gqlRes)
	}

	return &types.AnyResponse{Data: data}, nil
}
