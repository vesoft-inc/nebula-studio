package tests

import (
	"testing"
	"net/http"
	"bytes"
	"io/ioutil"
	"fmt"
)

func Test_DB_Connect(t *testing.T) {

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
    fmt.Println("response Body:", string(body))
	}
}


func Test_DB_Execute(t *testing.T) {

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
					"gql" : "SHOW SPACES;"}`),
		},
	}
	for _, tc := range cases {
		
		req, err := http.NewRequest(tc.requestMethod,tc.path, bytes.NewBuffer(tc.requestBody))
		req.Header.Set("Content-Type", "application/json")
		
		client := &http.Client{}
		fmt.Println("client :", client)
		resp, err := client.Do(req)
		
    if err != nil {
        panic(err)
		}
		
		defer resp.Body.Close()
		
    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println("response Body:", string(body))
	}
}
