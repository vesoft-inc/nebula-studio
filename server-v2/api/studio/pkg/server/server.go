package server

import (
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/service/importer"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/svc"
)

type (
	ServiceContext = svc.ServiceContext
	Config         = config.Config
)

var NewServiceContext = svc.NewServiceContext

func InitDB(dbFilePath string) {
	importer.InitDB(dbFilePath)
}
