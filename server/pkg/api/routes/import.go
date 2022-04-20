package routes

import (
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/controller"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/middleware"
)

var ImportRoute = base.Route{
	Path: "/api/import-tasks",
	Middlewares: []base.Hook{
		middleware.AuthenticatedLoginHandler,
	},
	Desc: "import",
	SubRoutes: []base.Route{
		{
			Path: "import",
			POST: controller.ImportData,
		},
		{
			Path: "action",
			POST: controller.HandleImportAction,
		},
		{
			Path: "config/{id:string}",
			GET:  controller.DownloadConfigFile,
		},
		{
			Path: "{id:string}/log",
			GET:  controller.DownloadImportLog,
		},
		{
			Path: "{id:string}/err-logs",
			GET:  controller.DownloadErrLog,
		},
		{
			Path: "logs",
			GET:  controller.ReadImportLog,
		},
		{
			Path: "err-logs",
			GET:  controller.ReadErrLog,
		},
		{
			Path: "working-dir",
			GET:  controller.GetWorkingDir,
		},
		{
			Path: "task-dir",
			GET:  controller.GetTaskDir,
		},
		{
			Path: "{id:string}/task-log-names",
			GET:  controller.GetTaskLogNames,
		},
	},
}
