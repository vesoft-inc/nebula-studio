package dao

import (
	"errors"
	"log"
	pool "nebula-go-api/service/pool"
	common "nebula-go-api/utils"
	"strconv"
	"strings"

	graph "github.com/vesoft-inc/nebula-go/nebula/graph"
)

type ExecuteResult struct {
	Headers []string                `json:"headers"`
	Tables  []map[string]common.Any `json:"tables"`
}

func getColumnValue(p *graph.ColumnValue) common.Any {
	if p.Str != nil {
		return string(p.Str)
	} else if p.Integer != nil {
		return strconv.FormatInt(*p.Integer, 10)
	} else if p.Id != nil {
		// return p.Id
		var id = int64(*p.Id)
		return strconv.FormatInt(id, 10)
	} else if p.SinglePrecision != nil {
		return p.SinglePrecision
	} else if p.DoublePrecision != nil {
		return p.DoublePrecision
	} else if p.Datetime != nil {
		return p.Datetime
	} else if p.Timestamp != nil {
		return p.Timestamp
	} else if p.Date != nil {
		return p.Date
	}
	return nil
}

// Connect return if the nebula connect succeed
func Connect(host, username, password string) (sessionID int64, err error) {
	sessionID, err = pool.NewConnection(host, username, password)
	if err != nil {
		log.Println(err)
		return sessionID, err
	}
	return sessionID, nil
}

func Execute(sessionID int64, gql string) (result ExecuteResult, err error) {
	result = ExecuteResult{
		Headers: make([]string, 0),
		Tables:  make([]map[string]common.Any, 0),
	}
	connection, err := pool.GetConnection(sessionID)
	if err != nil {
		log.Println(err)
		return result, err
	}
	responseChannel := make(chan pool.ChannelResponse)
	connection.RequestChannel <- pool.ChannelRequest{
		Gql:             gql,
		ResponseChannel: responseChannel,
	}
	response := <-responseChannel

	var resp *graph.ExecutionResponse
	if response.Error != nil {
		log.Println(response.Error)
		// the connection may be failed for broken pipe
		if strings.Contains(response.Error.Error(), "write: broken pipe") {
			// try reconnect
			err := pool.ReConnect(connection)
			if err == nil {
				return Execute(sessionID, gql)
			} else {
				return result, errors.New("connect refused for network")
			}
		}

		return result, response.Error
	} else {
		if response.Result.GetErrorCode() != graph.ErrorCode_SUCCEEDED {
			log.Printf("ErrorCode: %v, ErrorMsg: %s", response.Result.GetErrorCode(), response.Result.GetErrorMsg)
			return result, errors.New(resp.GetErrorMsg())
		}
		resp = response.Result
	}

	columns := resp.GetColumnNames()
	for i := 0; i < len(columns); i++ {
		result.Headers = append(result.Headers, string(columns[i]))
	}

	rows := resp.GetRows()
	for _, row := range rows {
		var rowValue = make(map[string]common.Any)
		for index, column := range row.GetColumns() {
			rowValue[result.Headers[index]] = getColumnValue(column)
		}
		result.Tables = append(result.Tables, rowValue)
	}

	return result, nil
}
