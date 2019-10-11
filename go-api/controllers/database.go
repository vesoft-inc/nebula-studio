package controllers

import (
	graphdb "go-api/service"
	"github.com/astaxie/beego"
)

type DatabaseController struct {
	beego.Controller
}

type Response struct {
	Code string `json:"name"`
	Data Any `json:"data"`
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
