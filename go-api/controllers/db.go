package controllers

import (
	graphdb "go-api/service"

	"github.com/astaxie/beego"
)

type DatabaseController struct {
	beego.Controller
}

type Response struct {
	Code    string `json:"code"`
	Data    Any    `json:"data"`
	Message string `json:"message"`
}

type Data map[string]interface{}

func (this *DatabaseController) Connect() {
	var res Response
	ok := graphdb.Connect("127.0.0.1:3699", "user", "password")
	if ok {
		res.Code = "0"
	} else {
		res.Code = "-1"
	}
	res.Data = make(map[string]Any)
	this.Data["json"] = &res
	this.ServeJSON()
}

func (this *DatabaseController) Execute() {
	var res Response
	host := this.GetString("host")
	username := this.GetString("username")
	password := this.GetString("password")
	gql := this.GetString("gql")
	result, err := graphdb.Execute(host, username, password, gql)
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
