package routers

import (
	"nebula-go-api/controllers"

	"github.com/astaxie/beego"
)

func init() {
	beego.Router("/api/db/connect", &controllers.DatabaseController{}, "POST:Connect")
	beego.Router("/api/db/exec", &controllers.DatabaseController{}, "POST:Execute")
}
