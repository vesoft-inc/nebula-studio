package main

import (
	"embed"
	"flag"
	"fmt"
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/handler"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/middleware"

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

	svcCtx := svc.NewServiceContext(c)
	server := rest.MustNewServer(c.RestConf, rest.WithNotFoundHandler(middleware.NewAssertsHandler(middleware.AssertsConfig{
		Root:       "assets",
		Filesystem: http.FS(embedAssets),
		SPA:        true,
	})))

	defer server.Stop()

	// global middleware
	// server.Use(auth.AuthMiddleware)
	server.Use(auth.AuthMiddlewareWithConfig(&c))

	// api handlers
	handler.RegisterHandlers(server, svcCtx)

	httpx.SetErrorHandler(func(err error) (int, interface{}) {
		return svcCtx.ResponseHandler.GetStatusBody(nil, nil, err)
	})

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
