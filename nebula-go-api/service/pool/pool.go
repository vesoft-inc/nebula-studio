package pool

import (
	"errors"
	"log"
	"sync"
	"time"

	nebula "github.com/vesoft-inc/nebula-go"
	"github.com/vesoft-inc/nebula-go/nebula/graph"
)

type Account struct {
	username string
	password string
}

type ChannelResponse struct {
	Result *graph.ExecutionResponse
	Error  error
}

type ChannelRequest struct {
	Gql             string
	ResponseChannel chan ChannelResponse
}

type Connection struct {
	RequestChannel chan ChannelRequest
	CloseChannel   chan bool
	CurrentSpace   string
	updateTime     int64
	client         *nebula.GraphClient
	account        *Account
}

const (
	maxConnectionNum  = 200
	secondsOfHalfHour = int64(30 * 60)
)

var connectionPool = make(map[int64]*Connection)
var currentConnectionNum = 0
var connectLock sync.Mutex

func NewConnection(host, username, password string) (sessionID int64, err error) {
	connectLock.Lock()
	defer connectLock.Unlock()
	recoverConnections()
	if currentConnectionNum >= maxConnectionNum {
		return -1, errors.New("Too many connections to nebula db")
	}

	client, err := nebula.NewClient(host)
	if err != nil {
		log.Println(err)
		return client.GetSessionID(), err
	}
	err = client.Connect(username, password)
	if err != nil {
		return 0, err
	}
	sessionID = client.GetSessionID()
	currentConnectionNum++
	connectionPool[sessionID] = &Connection{
		RequestChannel: make(chan ChannelRequest),
		CloseChannel:   make(chan bool),
		updateTime:     time.Now().Unix(),
		client:         client,
		account: &Account{
			username: username,
			password: password,
		},
	}

	// Make a goroutine to deal with concurrent requests from each connection
	go func() {
		connection := connectionPool[sessionID]
		for {
			select {
			case request := <-connection.RequestChannel:
				response, err := connection.client.Execute(request.Gql)
				request.ResponseChannel <- ChannelResponse{
					Result: response,
					Error:  err,
				}
			case <-connection.CloseChannel:
				connection.client.Disconnect()
				connectLock.Lock()
				delete(connectionPool, sessionID)
				currentConnectionNum--
				connectLock.Unlock()
				// Exit loop
				return
			}
		}
	}()

	return sessionID, nil
}

func GetConnection(sessionID int64) (connection *Connection, err error) {
	connectLock.Lock()
	defer connectLock.Unlock()

	connection, ok := connectionPool[sessionID]
	if ok {
		connection.updateTime = time.Now().Unix()
		return connection, nil
	}
	return nil, errors.New("connection refused for being released")
}

func ReConnect(connection *Connection) (err error) {
	connection.client.Disconnect()
	err = connection.client.Connect(connection.account.username, connection.account.password)

	return err
}

func recoverConnections() {
	nowTimeStamps := time.Now().Unix()
	for _, connection := range connectionPool {
		// release connection if not use over 30minutes
		if nowTimeStamps-connection.updateTime > secondsOfHalfHour {
			connection.CloseChannel <- true
		}
	}
}
