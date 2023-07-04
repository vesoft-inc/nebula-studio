package ws

import (
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/middlewares/batch_ngql"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/middlewares/logger"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/middlewares/ngql"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/utils"
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
		return
	}

	client := utils.NewClient(hub, conn, clientInfo)
	client.RegisterMiddleware([]utils.TMiddleware{
		logger.Middleware,
		batch_ngql.Middleware,
		ngql.Middleware,
	})
	client.Serve()
}
