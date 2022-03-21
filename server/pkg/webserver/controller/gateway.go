package controller

import (
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/types"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/middleware"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"
)

type execNGQLParams struct {
	Gql       string              `json:"gql"`
	ParamList types.ParameterList `json:"paramList"`
}
type batchExecNGQLParams struct {
	Gqls      []string            `json:"gqls"`
	ParamList types.ParameterList `json:"paramList"`
}

type gqlData struct {
	gql     string
	message string
	data    map[string]interface{}
}
type connectDBParams struct {
	Address string `json:"address"`
	Port    int    `json:"port"`
}

type disConnectDBParams struct {
	Nsid string `json:"nsid"`
}

func BatchExecNGQL(ctx iris.Context) base.Result {
	params := new(batchExecNGQLParams)
	err := ctx.ReadJSON(params)
	if err != nil {
		zap.L().Warn("execNGQLParams get fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	nsid := ctx.GetCookie("nsid")
	data := make([]map[string]interface{}, 0)

	for i := 0; i < len(params.Gqls); i++ {
		gql := params.Gqls[i]
		execute, _, err := dao.Execute(nsid, gql, make([]string, 0))
		gqlRes := make(map[string]interface{})
		gqlRes["gql"] = gql
		if err != nil {
			gqlRes["message"] = err.Error()
			gqlRes["code"] = base.Error
		} else {
			gqlRes["code"] = base.Success
		}
		gqlRes["data"] = execute
		data = append(data, gqlRes)
	}

	if len(params.ParamList) > 0 {
		execute, _, err := dao.Execute(nsid, "", params.ParamList)
		gqlRes := make(map[string]interface{})
		gqlRes["gql"] = strings.Join(params.ParamList, "; ")
		if err != nil {
			gqlRes["message"] = err.Error()
			gqlRes["code"] = base.Error
		} else {
			gqlRes["code"] = base.Success
		}
		gqlRes["data"] = execute
		data = append(data, gqlRes)
	}

	return base.Response{
		Code: base.Success,
		Data: data,
	}
}

func ExecNGQL(ctx iris.Context) base.Result {
	params := new(execNGQLParams)
	if err := ctx.ReadJSON(params); err != nil {
		zap.L().Warn("execNGQLParams get fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	nsid := ctx.GetCookie("nsid")
	execute, _, err := dao.Execute(nsid, params.Gql, params.ParamList)
	if err != nil {
		zap.L().Warn("gql execute fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	return base.Response{
		Code: base.Success,
		Data: execute,
	}
}

func ConnectDB(ctx iris.Context) base.Result {
	token := ctx.GetHeader("Authorization")
	tokenSlice := strings.Split(token, " ")
	if len(tokenSlice) != 2 {
		return base.Response{
			Code:    base.AuthorizationError,
			Message: "Not get token",
		}
	}

	decode, err := base64.StdEncoding.DecodeString(tokenSlice[1])
	if err != nil {
		return base.Response{
			Code:    base.AuthorizationError,
			Message: err.Error(),
		}
	}
	account := strings.Split(string(decode), ":")
	if len(account) < 2 {
		return base.Response{
			Code:    base.AuthorizationError,
			Message: "len of account is less than two",
		}
	}
	username, password := account[0], account[1]

	params := new(connectDBParams)
	if err = ctx.ReadJSON(params); err != nil {
		zap.L().Warn("connectDBParams get fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	clientInfo, err := dao.Connect(params.Address, params.Port, username, password)
	if err != nil {
		zap.L().Warn("connect DB fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	nebulaAddress := fmt.Sprintf("%s:%d", params.Address, params.Port)
	loginToken, err := middleware.GetLoginToken(nebulaAddress, username)
	if err != nil {
		zap.L().Warn("connect DB fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	data := make(map[string]string)
	data["version"] = string(clientInfo.NebulaVersion)
	ctx.SetCookieKV("nsid", data["nsid"])
	ctx.SetCookieKV("token", loginToken)
	return base.Response{
		Code: base.Success,
		Data: data,
	}
}

func DisconnectDB(ctx iris.Context) base.Result {
	params := new(disConnectDBParams)
	if err := ctx.ReadJSON(params); err != nil {
		zap.L().Warn("disConnectDBParams get fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	dao.Disconnect(params.Nsid)
	return base.Response{
		Code: base.Success,
	}
}
