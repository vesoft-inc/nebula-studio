package routes

import (
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/controller"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/middleware"
)

var GatewayRoute = base.Route{
	Path: "/api-nebula",
	Middlewares: []base.Hook{
		middleware.AuthenticatedLoginHandler,
	},
	Desc: "gateway",
	SubRoutes: []base.Route{
		{
			Path: "db/exec",
			POST: controller.ExecNGQL,
		},
		{
			Path: "db/batchExec",
			POST: controller.BatchExecNGQL,
		},
		{
			Path: "db/connect",
			POST: controller.ConnectDB,
		},
		{
			Path: "db/disconnect",
			POST: controller.DisconnectDB,
		},
	},
}
