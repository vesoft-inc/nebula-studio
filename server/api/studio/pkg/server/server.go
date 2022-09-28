package server

import (
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/handler"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/importer"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/zeromicro/go-zero/rest"
)

type (
	ServiceContext = svc.ServiceContext
	Config         = config.Config
)

var NewServiceContext = svc.NewServiceContext

func InitDB(dbFilePath string) {
	db.InitDB(dbFilePath)
	importer.InitTaskStatus()
}

func RegisterHandlers(server *rest.Server, studioSvcCtx *svc.ServiceContext) {
	handler.RegisterHandlers(server, studioSvcCtx)
}
