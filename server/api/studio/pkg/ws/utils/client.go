package utils

import (
	"bytes"
	"encoding/json"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	uuid "github.com/satori/go.uuid"
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

func noopDispatcher(msg *MessageReceive, client *Client) *MessagePost {
	return nil
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	ID         string
	Type       string
	Hub        *Hub
	clientInfo any
	mu         sync.RWMutex
	// The websocket connection.
	Conn *websocket.Conn
	// Buffered channel of outbound messages.
	Send chan []byte
	// message received middleware
	dispatcher TNext
}

func NewClient(hub *Hub, conn *websocket.Conn, clientType string, clientInfo any) (*Client, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}
	return &Client{
		ID:         id.String(),
		Type:       clientType,
		Hub:        hub,
		Conn:       conn,
		clientInfo: clientInfo,
		Send:       make(chan []byte, bufSize),
		dispatcher: noopDispatcher,
	}, nil
}

func (c *Client) GetClientInfo() any {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.clientInfo
}

func (c *Client) SetClientInfo(clientInfo any) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.clientInfo = clientInfo
}

func (c *Client) RegisterMiddleware(mds []TMiddleware) {
	next := noopDispatcher
	for i := len(mds) - 1; i >= 0; i-- {
		next = mds[i](next)
	}
	c.dispatcher = next
}

func (c *Client) Serve() {
	go c.writePump()
	go c.readPump()

	c.Hub.register <- c
}

func (c *Client) dispatchMessage(msg *[]byte) (closed bool) {
	defer func() {
		if err := recover(); err != nil {
			logx.Errorf("[WebSocket dispatchMessage panic]: %+v", err)
			closed = true
		}
	}()

	msgReceived := &MessageReceive{}

	err := json.Unmarshal(*msg, msgReceived)
	if err != nil {
		logx.Errorf("[WebSocket Unmarshal]: %v", err)
		return
	}

	msgPost := c.dispatcher(msgReceived, c)
	if msgPost == nil {
		return
	}
	msgSend, err := json.Marshal(msgPost)
	if err != nil {
		logx.Errorf("[WebSocket Marshal]: %v", err)
		return
	}
	c.Send <- msgSend
	return false
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logx.Errorf("[WebSocket UnexpectedClose]: %v", err)
			} else {
				logx.Errorf("[WebSocket ReadMessage]: %v", err)
			}
			break
		}

		msgReceivedByte := bytes.TrimSpace(bytes.Replace(message, newline, space, -1))

		// step 0: heartbeat
		if string(msgReceivedByte) == heartbeatRequest {
			c.Send <- []byte(heartbeatResponse)
			continue
		}

		// async logic process
		go c.dispatchMessage(&msgReceivedByte)
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
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				logx.Errorf("[WebSocket UnexpectedClose]: c.send length: %v, %s", len(c.Send), message)
				c.Conn.WriteControl(websocket.CloseMessage, []byte{}, time.Now().Add(time.Second))
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				logx.Errorf("[WebSocket WriteMessage]: %v", err)
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				logx.Errorf("[WebSocket WriteMessage Close]: %v", err)
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				logx.Errorf("[WebSocket ticker error]: %v", err)
				return
			}
		}
	}
}
