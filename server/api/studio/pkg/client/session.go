package client

import (
	"sync"
	"time"

	nebula "github.com/vesoft-inc/nebula-go/v3"
)

type SessionPool struct {
	ildeSessions   []*nebula.Session
	activeSessions []*nebula.Session
	mu             sync.Mutex
}

func (client *Client) createClientSession() (session *nebula.Session, err error) {
	session, err = client.graphClient.GetSession(client.account.username, client.account.password)
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (client *Client) getSession() (session *nebula.Session, err error) {
	pool := client.sessionPool
	pool.mu.Lock()
	idleLen := len(pool.ildeSessions)
	activeLen := len(pool.activeSessions)
	pool.mu.Unlock()
	if idleLen == 0 {
		session, err := client.createClientSession()
		if err != nil {
			if activeLen == 0 {
				return nil, err
			}
			// if active session is not empty, wait for the active session
			return nil, nil
		}
		pool.activeSessions = append(pool.activeSessions, session)
		return session, nil
	}
	pool.mu.Lock()
	curSession := pool.ildeSessions[0]
	pool.ildeSessions = pool.ildeSessions[1:]
	pool.activeSessions = append(pool.activeSessions, curSession)
	pool.mu.Unlock()
	return curSession, nil
}

func (pool *SessionPool) addSession(session *nebula.Session) {
	pool.mu.Lock()
	defer pool.mu.Unlock()
	for i, s := range pool.activeSessions {
		if s == session {
			pool.activeSessions = append(pool.activeSessions[:i], pool.activeSessions[i+1:]...)
			break
		}
	}
	pool.ildeSessions = append(pool.ildeSessions, session)
	go pool.releaseSession(session)
}

func (pool *SessionPool) releaseSession(clientSession *nebula.Session) {
	// if session is not used for 3 seconds, release it
	time.Sleep(3 * time.Second)
	pool.mu.Lock()
	defer pool.mu.Unlock()
	if len(pool.ildeSessions) == 1 {
		return
	}
	for i, session := range pool.ildeSessions {
		if session == clientSession {
			session.Release()
			pool.ildeSessions = append(pool.ildeSessions[:i], pool.ildeSessions[i+1:]...)
			break
		}
	}
}

func (pool *SessionPool) clearSessions() {
	pool.mu.Lock()
	defer pool.mu.Unlock()
	for _, session := range pool.ildeSessions {
		session.Release()
	}
	for _, session := range pool.activeSessions {
		session.Release()
	}
}
