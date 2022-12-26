package main

import (
	"embed"
	"flag"
	"fmt"
	"net/http"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/nebula-http-gateway/ccore/nebula/gateway/pool"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/handler"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/logging"
	studioMiddleware "github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/middleware"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/server"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws"
	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/proc"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/rest/httpx"
	"go.uber.org/zap"
)

var (
	//go:embed assets/*
	embedAssets embed.FS
	configFile  = flag.String("f", "etc/studio-api.yaml", "the config file")
)

func main() {
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c, conf.UseEnv())

	// init logger
	loggingOptions := logging.NewOptions()
	if err := loggingOptions.InitGlobals(); err != nil {
		panic(err)
	}
	if err := c.InitConfig(); err != nil {
		zap.L().Fatal("init config failed", zap.Error(err))
	}
	server.InitDB(c.File.SqliteDbFilePath)

	svcCtx := svc.NewServiceContext(c)
	server := rest.MustNewServer(c.RestConf, rest.WithNotFoundHandler(studioMiddleware.AssetsMiddlewareWithCtx(svcCtx, embedAssets)))

	defer server.Stop()
	waitForCalled := proc.AddWrapUpListener(func() {
		pool.ClearClients()
	})
	defer waitForCalled()

	// global middleware
	server.Use(auth.AuthMiddlewareWithCtx(svcCtx))
	server.Use(rest.ToMiddleware(middleware.ReserveRequest(middleware.ReserveRequestConfig{
		Skipper: func(r *http.Request) bool {
			return !utils.PathHasPrefix(r.URL.Path, utils.ReserveRequestRoutes)
		},
	})))
	server.Use(rest.ToMiddleware(middleware.ReserveResponseWriter(middleware.ReserveResponseWriterConfig{
		Skipper: func(r *http.Request) bool {
			return !utils.PathHasPrefix(r.URL.Path, utils.ReserveResponseRoutes)
		},
	})))

	// api handlers
	handler.RegisterHandlers(server, svcCtx)

	// websocket
	hub := ws.NewHub()
	go hub.Run()
	server.AddRoute(rest.Route{
		Method: http.MethodGet,
		Path:   "/nebula_ws",
		Handler: func(w http.ResponseWriter, r *http.Request) {
			clientInfo := &auth.AuthData{}
			tokenCookie, err := r.Cookie(svcCtx.Config.Auth.TokenName)
			if err == nil {
				clientInfo, _ = auth.Decode(tokenCookie.Value, svcCtx.Config.Auth.AccessSecret)
			}
			ws.ServeWebSocket(hub, w, r, clientInfo)
		},
	})

	httpx.SetErrorHandler(func(err error) (int, interface{}) {
		return svcCtx.ResponseHandler.GetStatusBody(nil, nil, err)
	})

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
