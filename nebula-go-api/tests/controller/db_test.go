package tests

import (
	"testing"
	"net/http"
	"bytes"
	"io/ioutil"
	"encoding/json"
	"fmt"
	common "nebula-go-api/utils"
	"log"
)

type Response struct {
	Code    string     `json:"code"`
	Data    common.Any `json:"data"`
	Message string     `json:"message"`
}

func Test_DB_Connect(t *testing.T) {
	var Response Response
	cases := []struct {
		path          string
		requestMethod string
		requestBody   []byte
	}{
		{	
			"http://127.0.0.1:8080/api/db/connect",
			"POST",
			[]byte(`{"username": "user",
					"password": "password",
					"host": "127.0.0.1:3699"}`),
		},
		{	
			"http://127.0.0.1:8080/api/db/connect",
			"POST",
			[]byte(`{"username": "user1",
					"password": "password",
					"host": "127.0.0.1:3699"}`),
		},
	}
	for _, tc := range cases {

		req, err := http.NewRequest(tc.requestMethod, tc.path, bytes.NewBuffer(tc.requestBody))
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{}
		fmt.Println("client :", client)
		resp, err := client.Do(req)
		
    if err != nil {
        panic(err)
    }

		defer req.Body.Close()
		body, _ := ioutil.ReadAll(resp.Body)
		 
    json.Unmarshal([]byte(body), &Response)
		if Response.Code == "-1" {
			fmt.Println("code = -1 :", string(body))
		}else if Response.Code == "0"{
			fmt.Println("code = 0")
		}else {
			log.Fatal(string(body))
		}
		
	}
}


func Test_DB_Execute(t *testing.T) {
	/*
	*/
	cases := []struct {
		path          string
		requestMethod string
		requestBody   []byte
	}{
		{	
			"http://127.0.0.1:8080/api/db/exec",
			"POST",
			[]byte(`{"username" : "user",
					"password" : "password",
					"host" : "127.0.0.1:3699",
					"gql" : "SHOW SPACES11;"}`),
		},
	}
	for _, tc := range cases {
		var Response Response
		req, err := http.NewRequest(tc.requestMethod,tc.path, bytes.NewBuffer(tc.requestBody))
		req.Header.Set("Content-Type", "application/json")
		
		client := &http.Client{}
		resp, err := client.Do(req)

    if err != nil {
        log.Fatal(err)
		}
		
		defer resp.Body.Close()
		
		body, _ := ioutil.ReadAll(resp.Body)

		json.Unmarshal([]byte(body), &Response)
		if Response.Code == "-1" {
			fmt.Println("code = -1 :", string(body))
		}else if Response.Code == "0"{
			fmt.Println("code = 0")
		}else {
			log.Fatal(string(body))
		}

	}
}
