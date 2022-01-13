package webserver

import (
	"github.com/vesoft-inc/nebula-studio/server/pkg/api/routes"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"

	"github.com/kataras/iris/v12"
	"github.com/kataras/iris/v12/middleware/logger"
	"github.com/kataras/iris/v12/middleware/recover"
)

func InitApp() *iris.Application {

	app := iris.New()
	app.Use(recover.New())
	app.Use(logger.New())

	APIRoute := &base.Route{
		Path: "",
		SubRoutes: []base.Route{
			routes.FilesRoute,
			routes.GatewayRoute,
			routes.ImportRoute,
		},
	}
	base.SetRoute(app, APIRoute)

	return app
}
