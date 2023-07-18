package gpt

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
)

var Config db.GPTConfig

func Init() {
	res := db.CtxDB.First(&Config)
	if res.RowsAffected == 0 {
		log.Print("GPT config not found")
	}
}

func Fetch(req map[string]any, callback func(str string)) (map[string]any, error) {

	// Convert the request parameters to a JSON string
	reqJSON, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to convert request parameters to JSON: %v", err)
	}

	// Create an HTTP request
	httpReq, err := http.NewRequest("POST", Config.URL, strings.NewReader(string(reqJSON)))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %v", err)
	}

	// Set the Content-Type and Authorization headers
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+Config.Key)
	httpReq.Header.Set("api-key", Config.Key)

	// Send the HTTP request
	client := &http.Client{
		Timeout: 60 * time.Second,
	}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send HTTP request: %v", err)
	}
	defer resp.Body.Close()
	defer client.CloseIdleConnections()

	// Check if the response is a server-sent event str
	if resp.Header.Get("Content-Type") == "text/event-stream" {
		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "data:") {
				event := strings.TrimPrefix(line, "data: ")
				event = strings.TrimSpace(event)
				callback(event)
				if strings.Contains(line, "[DONE]") {
					break
				}
			}
		}
		if err := scanner.Err(); err != nil {
			fmt.Println("reading standard input:", err)
		}
		return nil, nil
	}
	// Read the response data
	var respData map[string]any
	err = json.NewDecoder(resp.Body).Decode(&respData)
	if err != nil {
		return nil, fmt.Errorf("failed to parse response data: %v", err)
	}
	return respData, nil
}

type Document struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Url     string `json:"url"`
}
