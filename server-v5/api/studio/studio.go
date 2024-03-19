package main

import (
	"embed"
	"flag"
	"fmt"

	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/handler"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
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

	ctx := svc.NewServiceContext(c)
	handler.RegisterHandlers(server, ctx)

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
