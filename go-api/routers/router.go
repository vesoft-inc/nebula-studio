package routers

import (
	"go-api/controllers"

	"github.com/astaxie/beego"
)

func init() {
	beego.Router("/api/db/connect", &controllers.DatabaseController{}, "*:Connect")
	beego.Router("/api/db/exec", &controllers.DatabaseController{}, "*:Execute")
}
