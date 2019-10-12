package graphdb

import (
	"errors"
	common "go-api/utils"
	"log"

	nebula "github.com/vesoft-inc/nebula-go"
	"github.com/vesoft-inc/nebula-go/graph"
)

type ExecuteResult struct {
	Headers []string     `json:"headers"`
	Tables  []common.Any `json:"tables"`
}

func connect(host, username, password string) (client *nebula.GraphClient, err error) {
	client, err = nebula.NewClient(host)
	if err != nil {
		log.Fatal(err)
		return client, err
	}

	err = client.Connect(username, password)
	log.Printf("%v,xxxxxx", err)
	if err != nil {
		log.Fatal(err)
		return client, err
	}

	return client, err
}

// Connect return if the nebula connect succeed
func Connect(host, username, password string) bool {
	client, err := connect(host, username, password)
	if err != nil {
		log.Fatal(err)
		return false
	}
	defer client.Disconnect()
	return true
}

func Execute(host, username, password, gql string) (result ExecuteResult, err error) {
	client, err := connect(host, username, password)
	defer client.Disconnect()
	if err != nil {
		log.Fatal(err)
		return result, err
	}
	resp, err := client.Execute(gql)
	if err != nil {
		log.Fatal(err)
		return result, err
	} else {
		if resp.GetErrorCode() != graph.ErrorCode_SUCCEEDED {
			log.Printf("ErrorCode: %v, ErrorMsg: %s", resp.GetErrorCode(), resp.GetErrorMsg)
			return result, errors.New(resp.GetErrorMsg())
		}
	}
	columns := resp.GetColumnNames()
	for i := 0; i < len(columns); i++ {
		result.Headers = append(result.Headers, string(columns[i]))
	}

	return result, nil
}
