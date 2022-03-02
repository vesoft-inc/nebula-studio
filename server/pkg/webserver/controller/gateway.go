package controller

import (
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/dao"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/types"
	importconfig "github.com/vesoft-inc/nebula-importer/pkg/config"
	importerErrors "github.com/vesoft-inc/nebula-importer/pkg/errors"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/service/importer"

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

type importDataParams struct {
	ConfigPath string                   `json:"configPath"`
	ConfigBody *importconfig.YAMLConfig `json:"configBody"`
}

type handleImportActionParams struct {
	TaskId     string `json:"taskId"`
	TaskAction string `json:"taskAction"`
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
	err := ctx.ReadJSON(params)
	if err != nil {
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
	username, password := account[0], account[1]

	params := new(connectDBParams)
	err = ctx.ReadJSON(params)
	if err != nil {
		zap.L().Warn("connectDBParams get fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	clientInfo, err := dao.Connect(params.Address, params.Port, username, password)
	if err != nil {
		return nil
	}
	if err != nil {
		zap.L().Warn("connect DB fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	data := make(map[string]string)
	nsid := clientInfo.ClientID
	version := clientInfo.NebulaVersion
	data["nsid"] = nsid
	data["version"] = string(version)
	ctx.SetCookieKV("nsid", nsid)
	return base.Response{
		Code: base.Success,
		Data: data,
	}
}

func DisconnectDB(ctx iris.Context) base.Result {
	params := new(disConnectDBParams)
	err := ctx.ReadJSON(params)
	if err != nil {
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

func ImportData(ctx iris.Context) base.Result {
	taskId := importer.NewTaskID()
	task := importer.NewTask(taskId)
	importer.GetTaskMgr().PutTask(taskId, &task)
	params := new(importDataParams)
	err := ctx.ReadJSON(params)
	if err != nil {
		zap.L().Warn("importDataParams get fail", zap.Error(err))
		err = importerErrors.Wrap(importerErrors.InvalidConfigPathOrFormat, err)
	} else {
		err = importer.Import(taskId, params.ConfigPath, params.ConfigBody)
	}

	if err != nil {
		// task err: import task not start err handle
		task.TaskStatus = importer.StatusAborted.String()
		zap.L().Error(fmt.Sprintf("Failed to start a import task: `%s`, task result: `%v`", taskId, err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}

	return base.Response{
		Code:    base.Success,
		Data:    []string{taskId},
		Message: fmt.Sprintf("Import task %s submit successfully", taskId),
	}
}

func HandleImportAction(ctx iris.Context) base.Result {
	params := new(handleImportActionParams)
	err := ctx.ReadJSON(params)
	if err != nil {
		zap.L().Warn("handleImportActionParams get fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	data, err := importer.ImportAction(params.TaskId, importer.NewTaskAction(params.TaskAction))
	if err != nil {
		zap.L().Warn("importAction fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	return base.Response{
		Code:    base.Success,
		Message: "Processing a task action successfully",
		Data:    data,
	}
}
