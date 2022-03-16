package routes

import (
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/controller"
)

var ImportRoute = base.Route{
	Path: "/api/import-tasks",
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
			Path: "stats/{id:string}",
			GET:  controller.QueryImportStats,
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
			Path: "finish",
			POST: controller.Callback,
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
