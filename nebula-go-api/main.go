package main

import (
	_ "nebula-go-api/routers"

	"github.com/astaxie/beego"
)

func main() {
	beego.BConfig.WebConfig.Session.SessionCookieLifeTime = 3600
	beego.BConfig.WebConfig.Session.SessionName = "nsid"
	beego.BConfig.WebConfig.Session.SessionOn = true
	beego.Run()
}
