package main

import (
	"embed"
	"flag"
	"fmt"
	"net/http"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/handler"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/auth"
	studioMiddleware "github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/middleware"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest"
)

var (
	//go:embed assets/*
	embedAssets embed.FS
	configFile  = flag.String("f", "etc/studio-api.yaml", "the config file")
)

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	logx.MustSetup(c.Log)
	defer logx.Close()

	svcCtx := svc.NewServiceContext(c)
	opts := []rest.RunOption{
		rest.WithNotFoundHandler(studioMiddleware.AssetsMiddlewareWithCtx(svcCtx, embedAssets)),
	}

	server := rest.MustNewServer(c.RestConf, opts...)
	defer server.Stop()

	// global middleware
	server.Use(auth.AuthMiddlewareWithCtx(svcCtx))
	server.Use(rest.ToMiddleware(middleware.ReserveRequest(middleware.ReserveRequestConfig{
		Skipper: func(r *http.Request) bool {
			return false
		},
	})))
	server.Use(rest.ToMiddleware(middleware.ReserveResponseWriter(middleware.ReserveResponseWriterConfig{
		Skipper: func(r *http.Request) bool {
			return false
		},
	})))

	ctx := svc.NewServiceContext(c)
	handler.RegisterHandlers(server, ctx)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
