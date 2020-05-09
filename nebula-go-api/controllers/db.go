package controllers

import (
	"encoding/json"
	dao "nebula-go-api/service/dao"
	common "nebula-go-api/utils"

	"github.com/astaxie/beego"
)

type DatabaseController struct {
	beego.Controller
}

type Response struct {
	Code    string     `json:"code"`
	Data    common.Any `json:"data"`
	Message string     `json:"message"`
}

type Request struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Host     string `json:"host"`
}

type ExecuteRequest struct {
	SessionID int64  `json:"sessionID"`
	Gql       string `json:"gql"`
}

type Data map[string]interface{}

func (this *DatabaseController) Connect() {
	var res Response
	var params Request
	json.Unmarshal(this.Ctx.Input.RequestBody, &params)
	sessionID, err := dao.Connect(params.Host, params.Username, params.Password)

	if err == nil {
		res.Code = "0"
		m := make(map[string]common.Any)
		m["sessionID"] = sessionID
		res.Data = m
		this.SetSession("nsid", sessionID)
	} else {
		res.Code = "-1"
		res.Message = err.Error()
	}

	this.Data["json"] = &res
	this.ServeJSON()
}

func (this *DatabaseController) Execute() {
	var res Response
	var params ExecuteRequest
	sessionID := this.GetSession("nsid")
	if sessionID == nil {
		res.Code = "-1"
		res.Message = "connection refused for lack of session"
	} else {
		json.Unmarshal(this.Ctx.Input.RequestBody, &params)
		result, err := dao.Execute(sessionID.(int64), params.Gql)
		if err == nil {
			res.Code = "0"
			res.Data = &result
		} else {
			res.Code = "-1"
			res.Message = err.Error()
		}
	}
	this.Data["json"] = &res
	this.ServeJSON()
}
