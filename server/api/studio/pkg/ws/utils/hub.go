package utils

import "sync"

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	mu sync.RWMutex

	// Registered clients.
	clients map[string]*Client

	// Inbound messages from the clients.
	// broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		// broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[string]*Client, 0),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Send)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) SelectClient(selector func(clients map[string]*Client) *Client) *Client {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return selector(h.clients)
}

func (h *Hub) UseClients(selector func(clients map[string]*Client)) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	selector(h.clients)
}
