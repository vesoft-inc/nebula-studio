package service

import (
	"context"
	"net/http"
	"strings"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/go-pkg/response"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"

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

func (s *gatewayService) ConnectDB(request *types.ConnectDBParams) (*types.ConnectDBResult, error) {
	httpRes, _ := middleware.GetResponseWriter(s.ctx)

	tokenString, clientInfo, err := auth.ParseConnectDBParams(request, &s.svcCtx.Config)
	if err != nil {
		return nil, s.withErrorMessage(ecode.ErrBadRequest, err, "parse request failed")
	}

	configAuth := s.svcCtx.Config.Auth
	tokenCookie := http.Cookie{
		Name:     configAuth.TokenName,
		Value:    tokenString,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   int(configAuth.AccessExpire),
	}

	httpRes.Header().Add("Set-Cookie", tokenCookie.String())

	return &types.ConnectDBResult{
		Version: string(clientInfo.NebulaVersion),
	}, nil
}

func (s *gatewayService) DisconnectDB() (*types.AnyResponse, error) {
	authData, ok := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	if ok && authData.NSID != "" {
		dao.Disconnect(authData.NSID)
	}

	httpRes, _ := middleware.GetResponseWriter(s.ctx)
	configAuth := s.svcCtx.Config.Auth
	httpRes.Header().Set("Set-Cookie", utils.DisabledCookie(configAuth.TokenName).String())

	return &types.AnyResponse{Data: response.StandardHandlerDataFieldAny(nil)}, nil
}

func isSessionError(err error) bool {
	subErrMsgStr := []string{
		"session expired",
		"connection refused",
		"broken pipe",
		"an existing connection was forcibly closed",
		"Token is expired",
		"Session not existed",
	}
	for _, subErrMsg := range subErrMsgStr {
		if strings.Contains(err.Error(), subErrMsg) {
			return true
		}
	}
	return false
}

func (s *gatewayService) ExecNGQL(request *types.ExecNGQLParams) (*types.AnyResponse, error) {
	authData := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)

	execute, _, err := dao.Execute(authData.NSID, request.Gql, request.ParamList)
	if err != nil {
		isSErr := isSessionError(err)
		if isSErr {
			return nil, ecode.WithSessionMessage(err)
		}
		return nil, ecode.WithErrorMessage(ecode.ErrInternalServer, err, "execute failed")
	}

	return &types.AnyResponse{Data: response.StandardHandlerDataFieldAny(execute)}, nil
}

func (s *gatewayService) BatchExecNGQL(request *types.BatchExecNGQLParams) (*types.AnyResponse, error) {
	authData := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)

	NSID := authData.NSID
	gqls := request.Gqls
	paramList := request.ParamList

	data := make([]map[string]interface{}, 0)
	for _, gql := range gqls {
		execute, _, err := dao.Execute(NSID, gql, make([]string, 0))
		gqlRes := map[string]interface{}{"gql": gql, "data": execute}
		if err != nil {
			isSErr := isSessionError(err)
			if isSErr {
				return nil, ecode.WithSessionMessage(err)
			}
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

	return &types.AnyResponse{Data: response.StandardHandlerDataFieldAny(data)}, nil
}
