package routes

import (
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/controller"
)

var ImportRoute = base.Route{
	Path: "/api/import",
	Desc: "import",
	SubRoutes: []base.Route{
		{
			Path: "log",
			GET:  controller.ReadLog,
		},
		{
			Path: "config",
			POST: controller.CreateConfigFile,
		},
		{
			Path: "finish",
			POST: controller.Callback,
		},
		{
			Path: "working_dir",
			GET:  controller.GetWorkingDir,
		},
	},
}
