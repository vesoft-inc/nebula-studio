package main

import (
	"flag"
	"net/http"
	"strconv"

	"github.com/vesoft-inc/nebula-studio/server/pkg/config"
	"github.com/vesoft-inc/nebula-studio/server/pkg/logging"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/service/importer"

	"go.uber.org/zap"
)

func main() {
	var address string
	var port int
	var studioServerConfig string

	flag.StringVar(&studioServerConfig, "studio-config", "./config/example-config.yaml", "path to the platform config file")
	flag.Parse()

	// init logger
	loggingOptions := logging.NewOptions()
	if err := loggingOptions.InitGlobals(); err != nil {
		panic(err)
	}

	if err := config.InitConfig(studioServerConfig); err != nil {
		zap.L().Fatal("init config failed", zap.Error(err))
	}

	address = config.Cfg.Web.Address
	port = config.Cfg.Web.Port

	importer.InitDB()

	app := webserver.InitApp()
	if err := app.Listen(address + ":" + strconv.Itoa(port)); err != nil && err != http.ErrServerClosed {
		zap.L().Fatal("Listen failed", zap.Error(err))
	}
}
