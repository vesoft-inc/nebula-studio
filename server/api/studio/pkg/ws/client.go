package ws

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/client"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/zeromicro/go-zero/core/logx"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	// Max ngql length can be executed is 4MB
	maxMessageSize = 8 * 1024 * 1024

	// send buffer size
	bufSize = 512

	heartbeatRequest = "1"

	heartbeatResponse = "2"
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub        *Hub
	clientInfo *auth.AuthData
	// The websocket connection.
	conn *websocket.Conn
	// Buffered channel of outbound messages.
	send chan []byte
}

func (c *Client) runNgql(msgReceived *MessageReceive) (closed bool) {
	defer func() {
		if err := recover(); err != nil {
			logx.Errorf("[WebSocket runNgql panic]: %+v", err)
			closed = true
		}
	}()

	msgPost := MessagePost{
		Header: MessagePostHeader{
			MsgId:    msgReceived.Header.MsgId,
			SendTime: time.Now().UnixMilli(),
		},
		Body: MessagePostBody{
			MsgType: msgReceived.Body.MsgType,
		},
	}

	gqls := make([]string, 0)
	space, _ := msgReceived.Body.Content["space"].(string)
	if reqGql, ok := msgReceived.Body.Content["gql"].(string); ok {
		gqls = append(gqls, reqGql)
	}
	execute, err := client.Execute(c.clientInfo.NSID, space, gqls)
	if err != nil {
		logx.Errorf("[WebSocket runNgql]: msgReceived.Body.Content(%v); error(%v)", &msgReceived.Body.Content, err)
		content := map[string]any{
			"code":    base.Error,
			"message": err.Error(),
		}
		if auth.IsSessionError(err) {
			content["code"] = ecode.ErrSession.GetCode()
		}
		msgPost.Body.Content = &content
	} else {
		res := execute[0]
		if res.Error != nil {
			err = res.Error
			content := map[string]any{
				"code":    base.Error,
				"message": err.Error(),
			}
			if auth.IsSessionError(err) {
				content["code"] = ecode.ErrSession.GetCode()
			}
			msgPost.Body.Content = &content
		} else {
			msgPost.Body.Content = map[string]any{
				"code":    base.Success,
				"data":    &execute[0].Result,
				"message": "Success",
			}
		}
	}
	msgSend, err := json.Marshal(msgPost)
	c.send <- msgSend
	return false
}

func (c *Client) runBatchNgql(msgReceived *MessageReceive) (closed bool) {
	defer func() {
		if err := recover(); err != nil {
			logx.Errorf("[WebSocket runBatchNgql panic]: %+v", err)
			closed = true
		}
	}()

	msgPost := MessagePost{
		Header: MessagePostHeader{
			MsgId:    msgReceived.Header.MsgId,
			SendTime: time.Now().UnixMilli(),
		},
		Body: MessagePostBody{
			MsgType: msgReceived.Body.MsgType,
		},
	}

	gqls := []string{}
	space, _ := msgReceived.Body.Content["space"].(string)

	resContentData := make([]map[string]any, 0)

	if reqGqls, ok := msgReceived.Body.Content["gqls"].([]any); ok {
		for _, s := range reqGqls {
			if gql, ok := s.(string); ok {
				gqls = append(gqls, gql)
			}
		}
	}
	executes, err := client.Execute(c.clientInfo.NSID, space, gqls)
	if err != nil {
		logx.Errorf("[WebSocket runNgql]: msgReceived.Body.Content(%v); error(%v)", &msgReceived.Body.Content, err)
		content := map[string]any{
			"code":    base.Error,
			"message": err.Error(),
		}
		if auth.IsSessionError(err) {
			content["code"] = ecode.ErrSession.GetCode()
		}
		msgPost.Body.Content = &content
	} else {
		for _, execute := range executes {
			gqlRes := map[string]any{"gql": execute.Gql, "data": execute.Result, "error": execute.Error}
			if execute.Error != nil {
				err = execute.Error
				gqlRes["message"] = err.Error()
				gqlRes["code"] = base.Error
				if auth.IsSessionError(err) {
					gqlRes["code"] = ecode.ErrSession.GetCode()
				}
			} else {
				gqlRes["code"] = base.Success
			}
			resContentData = append(resContentData, gqlRes)
		}
		msgPost.Body.Content = map[string]any{
			"code":    base.Success,
			"data":    resContentData,
			"message": "Success",
		}
	}

	msgSend, _ := json.Marshal(msgPost)
	c.send <- msgSend
	return false
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logx.Errorf("[WebSocket UnexpectedClose]: %v", err)
			} else {
				logx.Errorf("[WebSocket ReadMessage]: %v", err)
			}
			break
		}

		msgReceivedByte := bytes.TrimSpace(bytes.Replace(message, newline, space, -1))

		if string(msgReceivedByte) == heartbeatRequest {
			c.send <- []byte(heartbeatResponse)
			continue
		}

		msgReceived := MessageReceive{}
		json.Unmarshal(msgReceivedByte, &msgReceived)

		if msgReceived.Body.MsgType == "ngql" {
			// async run ngql
			go c.runNgql(&msgReceived)
		} else if msgReceived.Body.MsgType == "batch_ngql" {
			// async run batch ngql
			go c.runBatchNgql(&msgReceived)
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				logx.Errorf("[WebSocket UnexpectedClose]: c.send length: %v", len(c.send))
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				logx.Errorf("[WebSocket WriteMessage]: %v", err)
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ServeWs handles websocket requests from the peer.
func ServeWebSocket(hub *Hub, w http.ResponseWriter, r *http.Request, clientInfo *auth.AuthData) {
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

	client := &Client{
		hub:        hub,
		conn:       conn,
		send:       make(chan []byte, bufSize),
		clientInfo: clientInfo,
	}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}
