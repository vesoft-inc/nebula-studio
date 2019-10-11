package routers

import (
	"go-api/controllers"

	"github.com/astaxie/beego"
)

func init() {
	beego.Router("/api/connect", &controllers.DatabaseController{}, "*:Connect")
}
