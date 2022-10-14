package service

import (
	"context"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/samber/lo"
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
		ExecSeqNGQL(request *types.ExecNGQLParams) (*types.ExecSeqNGQLResult, error)
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

	httpsEnable := s.svcCtx.Config.CertFile != "" && s.svcCtx.Config.KeyFile != ""
	if httpsEnable {
		tokenCookie.Secure = true
		tokenCookie.SameSite = http.SameSiteNoneMode
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

func (s *gatewayService) ExecSeqNGQL(request *types.ExecNGQLParams) (*types.ExecSeqNGQLResult, error) {
	authData := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)

	reg, _ := regexp.Compile(`:sleep\s+(\d+);`)

	/**
	 * ```text
	 * create tag index player_index_0 on player();
	 * :sleep 1;
	 * create tag index player_index_1 on player(name(20));
	 * :sleep 3;
	 * insert vertex player(name,age) values "player100":("Tim Duncan", 42);
	 * ```
	 */
	gqlStrList := reg.Split(request.Gql, -1)
	// [[":sleep 1;", "1"], [":sleep 3;", "3"]] --> [1, 3]
	sleepTimeList := lo.Map(reg.FindAllStringSubmatch(request.Gql, -1), func(s []string, _ int) int {
		sleepTime, _ := strconv.Atoi(s[1])
		return sleepTime
	})

	totalSleepTime := lo.Reduce(sleepTimeList, func(a, b, _ int) int { return a + b }, 0)

	maxTimeout := lo.Ternary(s.svcCtx.Config.Timeout > 0, int(s.svcCtx.Config.Timeout), 3000) / 1000

	if totalSleepTime >= maxTimeout {
		return nil, s.withErrorMessage(ecode.ErrParam, fmt.Errorf("total sleep time must less than %ds", maxTimeout))
	}

	// The maximum number of statements ngql can execute at the same time is 512
	maxStatementNum := 512
	for idx, gql := range gqlStrList {
		gqlList := strings.Split(gql, ";")

		if len(gqlList) <= maxStatementNum {
			_, _, err := dao.Execute(authData.NSID, gql, request.ParamList)
			if err != nil {
				return nil, s.withErrorMessage(ecode.ErrInternalServer, err, "execute failed")
			}
		} else {
			for chunkIdx := 0; chunkIdx < len(gqlList); chunkIdx += maxStatementNum {
				gqlChunkList := gqlList[chunkIdx:lo.Min([]int{chunkIdx + maxStatementNum, len(gqlList)})]
				_, _, err := dao.Execute(authData.NSID, strings.Join(gqlChunkList[:], ";"), request.ParamList)
				if err != nil {
					return nil, s.withErrorMessage(ecode.ErrInternalServer, err, "execute failed")
				}
			}
		}

		if idx < len(sleepTimeList) {
			time.Sleep(time.Duration(sleepTimeList[idx]) * time.Second)
		}
	}

	return &types.ExecSeqNGQLResult{OK: true}, nil
}
