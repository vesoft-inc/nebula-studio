package controllers

import (
	"encoding/json"
	graphdb "nebula-go-api/service"
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
	Host string `json:"host"`
	Gql string `json:"gql"`
}

type Data map[string]interface{}

func (this *DatabaseController) Connect() {
	var res Response
	var params Request
	json.Unmarshal(this.Ctx.Input.RequestBody, &params)
	ok := graphdb.Connect(params.Host, params.Username, params.Password)
	if ok {
		res.Code = "0"
	} else {
		res.Code = "-1"
	}
	res.Data = make(map[string]common.Any)
	this.Data["json"] = &res
	this.ServeJSON()
}

func (this *DatabaseController) Execute() {
	var res Response
	var params Request
	json.Unmarshal(this.Ctx.Input.RequestBody, &params)
	result, err := graphdb.Execute(params.Host, params.Username, params.Password, params.Gql)
	if err == nil {
		res.Code = "0"
		res.Data = &result
	} else {
		res.Code = "-1"
		res.Message = err.Error()
	}
	this.Data["json"] = &res
	this.ServeJSON()
}
