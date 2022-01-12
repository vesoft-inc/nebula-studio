package routes

import (
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/controller"
)

var GatewayRoute = base.Route{
	Path: "/api-nebula",
	Desc: "gateway",
	SubRoutes: []base.Route{
		{
			Path: "db/exec",
			POST: controller.ExecNGQL,
		},
		{
			Path: "db/connect",
			POST: controller.ConnectDB,
		},
		{
			Path: "db/disconnect",
			POST: controller.DisconnectDB,
		},
		{
			Path: "task/import",
			POST: controller.ImportData,
		},
		{
			Path: "task/import/action",
			POST: controller.HandleImportAction,
		},
	},
}
