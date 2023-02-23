package client

import (
	"sync"
	"time"

	nebula "github.com/vesoft-inc/nebula-go/v3"
	"github.com/zeromicro/go-zero/core/logx"
)

type SessionPool struct {
	sessions map[int64]*ClientSession
	mu       sync.Mutex
	waitlist []ChannelRequest
	waitMu   sync.Mutex
}

type ClientSession struct {
	session  *nebula.Session
	id       int64
	isLocked bool
	usedTime time.Time
}

func (client *Client) createClientSession() (session *ClientSession, id int64, err error) {
	_session, err := client.graphClient.GetSession(client.account.username, client.account.password)
	if err != nil {
		return nil, id, err
	}
	id = _session.GetSessionID()
	clientSession := ClientSession{session: _session, id: id}
	return &clientSession, id, nil
}

func (client *Client) getSession() (session *ClientSession, err error) {
	pool := client.sessionPool
	pool.mu.Lock()
	defer pool.mu.Unlock()
	if len(pool.sessions) == 0 {
		// init first session
		clientSession, id, err := client.createClientSession()
		if err != nil {
			logx.Errorf("[Init first session failed]: %+v", err)
			return nil, err
		}
		pool.sessions[id] = clientSession
		clientSession.isLocked = true
		return clientSession, nil
	}
	var clientSession *ClientSession
	for i := range pool.sessions {
		if !pool.sessions[i].isLocked {
			clientSession = pool.sessions[i]
			clientSession.isLocked = true
			break
		}
	}
	if clientSession != nil {
		return clientSession, nil
	}
	clientSession, id, err := client.createClientSession()
	if err != nil {
		logx.Errorf("[Init other session failed]: %+v", err)
		// if create session failed, return nil, add request to waitlist
		return nil, nil
	}
	pool.sessions[id] = clientSession
	clientSession.isLocked = true
	return clientSession, nil
	// TODO session size limit
}

func (pool *SessionPool) releaseSession(clientSession *ClientSession) {
	// if session is not used for 3 seconds, release it
	go func() {
		time.Sleep(3 * time.Second)
		pool.mu.Lock()
		defer pool.mu.Unlock()
		if clientSession.isLocked {
			return
		}
		if len(pool.sessions) == 1 {
			return
		}
		if time.Since(clientSession.usedTime) >= 3*time.Second {
			clientSession.session.Release()
			delete(pool.sessions, clientSession.id)
		}
	}()
}

func (pool *SessionPool) clearSessions() {
	pool.mu.Lock()
	defer pool.mu.Unlock()
	for _, client := range pool.sessions {
		client.session.Release()
	}
}
