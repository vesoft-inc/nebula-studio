package graphd

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	nebula "github.com/vesoft-inc/nebula-ng-tools/golang"
)

const (
	address  = "192.168.8.145"
	port     = 9669
	username = "root"
	password = "nebula"
)

var addresses = fmt.Sprintf("%s:%d", address, port)

func TestCreateGraph(t *testing.T) {
	client, err := nebula.NewNebulaClient(addresses, username, password)
	if err != nil {
		t.Error(err)
	}
	defer client.Close()

	createGraphTypeGql := `
		CREATE GRAPH TYPE IF NOT EXISTS nba_type AS {
			(player LABEl player{id INT PRIMARY KEY,name STRING,age INT}),
			(team LABEL team{id INT PRIMARY KEY,name STRING}),
			(player)-[serve:serve{start_year INT,end_year INT}]->(team),
			(player)-[follow:follow{degree INT}]->(player)
		}
	`
	_, err = RunGql(client, createGraphTypeGql)
	if err != nil {
		t.Error(err)
	}
	time.Sleep(3 * time.Second)

	createGraphGql := `CREATE GRAPH IF NOT EXISTS nba_demo nba_type`
	_, err = RunGql(client, createGraphGql)
	if err != nil {
		t.Error(err)
	}
	time.Sleep(3 * time.Second)

	insertGqls := []string{
		// `USE nba_demo INSERT NODE player ({id:114,name:"Tracy McGrady",age:39}), ({id:117,name:"Stephen Curry",age:31})`,
		// `USE nba_demo INSERT NODE team ({id:221,name:"Bulls"}), ({id:219,name:"76ers"})`,
		// `USE nba_demo INSERT EDGE serve ({id:117})-[{start_year:2004,end_year:2008}]->({id:221}),({id:114})-[{start_year:2005,end_year:2010}]->({id:219})`,
		`USE nba_demo INSERT EDGE follow ({id:117})-[{degree:100}]->({id:114})`,
	}
	for _, gql := range insertGqls {
		_, err = RunGql(client, gql)
		if err != nil {
			t.Error(err)
		}
	}
}

func TestRunShow(t *testing.T) {
	client, err := nebula.NewNebulaClient(addresses, username, password)
	if err != nil {
		t.Error(err)
		return
	}
	defer client.Close()

	// gql := `SHOW GRAPHS`
	gql := `DESCRIBE GRAPH nba_demo`
	res, err := RunGql(client, gql)
	if err != nil {
		t.Error(err)
		return
	}

	jsonResult, _ := json.Marshal(res)
	fmt.Println("=====", string(jsonResult))
}

func TestRunMatch(t *testing.T) {
	client, err := nebula.NewNebulaClient(addresses, username, password)
	if err != nil {
		t.Error(err)
	}
	defer client.Close()

	// gql := `USE nba_demo MATCH (v) RETURN v limit 1`
	// gql := `USE nba_demo MATCH (v:team) RETURN v`
	// gql := `USE nba_demo MATCH ()-[e]-() RETURN e limit 10`
	gql := `USE nba_demo MATCH p=()-[e]-() RETURN p,e limit 2`
	// gql := `for i in LIST [1,2,3,4,5] RETURN collect(i) GROUP BY ()`
	// gql := `RETURN "123" as num`
	res, err := RunGql(client, gql)
	if err != nil {
		t.Error(err)
		return
	}

	jsonResult, _ := json.Marshal(res)
	t.Log(string(jsonResult))
}
