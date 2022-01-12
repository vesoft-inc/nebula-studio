package routes

import (
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/controller"
)

var FilesRoute = base.Route{
	Path: "/api/files",
	Desc: "file",
	SubRoutes: []base.Route{
		{
			Path: "",
			GET:  controller.FilesIndex,
		},
		{
			Path:   "{id:string}",
			DELETE: controller.FilesDestroy,
		},
		{
			Path: "",
			PUT:  controller.FilesUpload,
		},
	},
}
