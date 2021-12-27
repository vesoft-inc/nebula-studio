package controller

import (
	"fmt"

	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula"
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

type connectDBParams struct {
	Address  string `json:"address"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	Version  string `json:"version"`
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
	params := new(connectDBParams)
	err := ctx.ReadJSON(params)
	if err != nil {
		zap.L().Warn("connectDBParams get fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	if params.Version == "" {
		params.Version = string(nebula.VersionAuto)
	}
	nsid, err := dao.Connect(params.Address, params.Port, params.Username, params.Password, nebula.Version(params.Version))
	//sessions.Get(ctx).Set("nsid", nsid)
	if err != nil {
		zap.L().Warn("connect DB fail", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	data := make(map[string]string)
	data["nsid"] = nsid
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
