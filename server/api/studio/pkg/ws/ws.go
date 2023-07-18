package ws

import (
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/middlewares/batch_ngql"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/middlewares/gpt"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/middlewares/logger"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/middlewares/ngql"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/utils"
	"github.com/zeromicro/go-zero/core/logx"
)

func ServeWebSocket(hub *utils.Hub, w http.ResponseWriter, r *http.Request, clientInfo *auth.AuthData) {
	upgrader := websocket.Upgrader{
		// ReadBufferSize:  1024,
		// WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
		Error: func(w http.ResponseWriter, r *http.Request, status int, reason error) {
			w.WriteHeader(status)
			w.Write([]byte(reason.Error()))
		},
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logx.Errorf("[WebSocket Upgrade]: %v", err)
		return
	}

	client, err := utils.NewClient(hub, conn, "browser", clientInfo)
	if err != nil {
		logx.Errorf("[WebSocket NewClient]: %v", err)
		conn.Close()
		return
	}

	client.RegisterMiddleware([]utils.TMiddleware{
		logger.Middleware,
		batch_ngql.Middleware,
		ngql.Middleware,
		gpt.Middleware,
	})
	client.Serve()
}
