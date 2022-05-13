package main

import (
	"embed"
	"flag"
	"fmt"
	"net/http"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/handler"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service/importer"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	Config "github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/logging"
	"go.uber.org/zap"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/httpx"
)

//go:embed assets/*
var embedAssets embed.FS
var configFile = flag.String("f", "etc/studio-api.yaml", "the config file")

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c, conf.UseEnv())

	// init logger
	loggingOptions := logging.NewOptions()
	if err := loggingOptions.InitGlobals(); err != nil {
		panic(err)
	}

	if err := Config.InitConfig(*configFile); err != nil {
		zap.L().Fatal("init config failed", zap.Error(err))
	}

	importer.InitDB()

	svcCtx := svc.NewServiceContext(c)
	server := rest.MustNewServer(c.RestConf, rest.WithNotFoundHandler(middleware.NewAssetsHandler(middleware.AssetsConfig{
		Root:       "assets",
		Filesystem: http.FS(embedAssets),
		SPA:        true,
	})))

	defer server.Stop()

	// global middleware
	server.Use(auth.AuthMiddlewareWithCtx(svcCtx))

	// api handlers
	handler.RegisterHandlers(server, svcCtx)

	httpx.SetErrorHandler(func(err error) (int, interface{}) {
		return svcCtx.ResponseHandler.GetStatusBody(nil, nil, err)
	})

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
