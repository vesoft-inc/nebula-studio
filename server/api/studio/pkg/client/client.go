package client

import (
	"errors"
	"sync"
	"time"

	uuid "github.com/satori/go.uuid"
	nebula "github.com/vesoft-inc/nebula-go/v3"
	"github.com/zeromicro/go-zero/core/logx"
)

var (
	ConnectionClosedError = errors.New("an existing connection was forcibly closed, please check your network")
	SessionLostError      = errors.New("the connection session was lost, please connect again")
	ClientNotExistedError = errors.New("get client error: client not existed, session expired")
)

// Console side commands
const (
	Unknown                      = -1
	Param                        = 1
	Params                       = 2
	clientRecycleNum             = 30
	clientMaxNum                 = 200
	SessionExpiredDuration int64 = 3600
)

type Account struct {
	username string
	password string
	host     nebula.HostAddress
}

type ChannelResponse struct {
	Result *nebula.ResultSet
	Params ParameterMap
	Msg    interface{}
	Error  error
}

type ChannelRequest struct {
	Gql             string
	ResponseChannel chan ChannelResponse
	ParamList       ParameterList
	Space           string
}

type Client struct {
	graphClient    *nebula.ConnectionPool
	RequestChannel chan ChannelRequest
	CloseChannel   chan bool
	updateTime     int64
	parameterMap   ParameterMap
	account        *Account
	sessionPool    *SessionPool
}

type ClientInfo struct {
	ClientID string
}

var (
	clientPool       = make(map[string]*Client)
	currentClientNum = 0
	clientMux        sync.Mutex
)

var log = nebula.DefaultLogger{}

var routineLimit = 100

func NewClient(address string, port int, username string, password string, conf nebula.PoolConfig) (*ClientInfo, error) {
	var err error

	// TODO: it's better to add a schedule to make it instead
	if currentClientNum > clientRecycleNum {
		go recycleClients()
		if currentClientNum >= clientMaxNum {
			return nil, errors.New("There is no idle connection now, please try it later")
		}
	}
	hostAddress := nebula.HostAddress{Host: address, Port: port}
	hostList := []nebula.HostAddress{hostAddress}
	pool, err := nebula.NewConnectionPool(hostList, conf, log)
	if err != nil {
		logx.Errorf("[Init connection pool error]: %+v", err)
		return nil, err
	}

	u, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	nsid := u.String()
	client := &Client{
		graphClient:    pool,
		RequestChannel: make(chan ChannelRequest),
		CloseChannel:   make(chan bool),
		updateTime:     time.Now().Unix(),
		parameterMap:   make(ParameterMap),
		account: &Account{
			username: username,
			password: password,
			host:     hostAddress,
		},
		sessionPool: &SessionPool{
			sessions: make(map[int64]*ClientSession),
			waitlist: make([]ChannelRequest, 0),
		},
	}

	clientMux.Lock()
	clientPool[nsid] = client
	currentClientNum++
	clientMux.Unlock()

	for i := 0; i < routineLimit; i++ {
		go client.handleRequest(nsid)
	}

	info := &ClientInfo{
		ClientID: nsid,
	}
	return info, err
}

func GetClient(nsid string) (*Client, error) {
	clientMux.Lock()
	defer clientMux.Unlock()

	if client, ok := clientPool[nsid]; ok {
		client.updateTime = time.Now().Unix()
		return client, nil
	}

	return nil, ClientNotExistedError
}

func CloseClient(nsid string) {
	client := clientPool[nsid]
	if client != nil {
		client.CloseChannel <- true
	}
}

func ClearClients() {
	for _, client := range clientPool {
		client.sessionPool.clearSessions()
		client.graphClient.Close()
	}
}

func recycleClients() {
	clientMux.Lock()
	for _, client := range clientPool {
		now := time.Now().Unix()
		expireAt := client.updateTime + SessionExpiredDuration
		if now > expireAt {
			client.CloseChannel <- true
		}
	}
	clientMux.Unlock()
}
