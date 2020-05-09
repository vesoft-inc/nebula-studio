package pool

import (
	"errors"
	"log"
	"time"

	nebula "github.com/vesoft-inc/nebula-go"
)

type Connection struct {
	updateTime int64
	client     *nebula.GraphClient
}

var connectionPool = make(map[int64]Connection)
var maxConnectionNum = 200
var currentConnectionNum = 0

func NewConnection(host, username, password string) (sessionID int64, err error) {
	RecoverConnections()
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
	currentConnectionNum++
	sessionID = client.GetSessionID()
	connectionPool[sessionID] = Connection{
		updateTime: time.Now().Unix(),
		client:     client,
	}

	return sessionID, nil
}

func GetConnection(sessionID int64) (client *nebula.GraphClient, err error) {
	connection, ok := connectionPool[sessionID]
	if ok {
		connection.updateTime = time.Now().Unix()
		return connection.client, nil
	}
	return nil, errors.New("connection refused for being released")
}

func RecoverConnections() {
	nowTimeStamps := time.Now().Unix()
	secondsOfHalfHour := int64(30 * 60)
	for sessionID, connection := range connectionPool {
		// release connection if not use over 30minutes
		if nowTimeStamps-connection.updateTime > secondsOfHalfHour {
			defer DisConnect(sessionID)
		}
	}
}

func DisConnect(sessionID int64) {
	if connection, ok := connectionPool[sessionID]; ok {
		defer connection.client.Disconnect()
		delete(connectionPool, sessionID)
		currentConnectionNum--
	}
}
