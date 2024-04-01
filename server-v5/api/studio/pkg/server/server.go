package server

import (
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/handler"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/zeromicro/go-zero/rest"
)

type (
	ServiceContext = svc.ServiceContext
	Config         = config.Config
)

var NewServiceContext = svc.NewServiceContext

func RegisterHandlers(server *rest.Server, studioSvcCtx *svc.ServiceContext) {
	handler.RegisterHandlers(server, studioSvcCtx)
}
