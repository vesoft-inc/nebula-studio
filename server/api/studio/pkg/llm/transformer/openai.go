package transformer

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
)

type Handler interface {
	HandleRequest(req map[string]any, config *db.LLMConfig) (*http.Request, error)
	HandleResponse(resp *http.Response, callback func(str string)) (map[string]any, error)
}

type OpenAI struct {
}

func (o *OpenAI) HandleRequest(req map[string]any, config *db.LLMConfig) (*http.Request, error) {
	configs := make(map[string]any)
	err := json.Unmarshal([]byte(config.Config), &configs)
	if err == nil {
		req["model"] = configs["model"]
	}
	// Convert the request parameters to a JSON string
	reqJSON, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to convert request parameters to JSON: %v", err)
	}

	// Create an HTTP request
	httpReq, err := http.NewRequest("POST", config.URL, strings.NewReader(string(reqJSON)))
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %v", err)
	}

	// Set the Content-Type and Authorization headers
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+config.Key)
	httpReq.Header.Set("api-key", config.Key)
	return httpReq, nil
}

func (o *OpenAI) HandleResponse(resp *http.Response, callback func(str string)) (map[string]any, error) {
	// Check if the response is a server-sent event str
	if resp.Header.Get("Content-Type") == "text/event-stream" {
		scanner := bufio.NewScanner(resp.Body)
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "data:") {
				event := strings.TrimPrefix(line, "data:")
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
		callback("[DONE]") // ensure has done
		return nil, nil
	}
	// Read the response data
	var respData map[string]any

	// Read body text
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %s %v", string(bodyBytes), err)
	}
	err = json.Unmarshal(bodyBytes, &respData)
	if err != nil {
		return nil, fmt.Errorf("failed to parse response data: %s %v", string(bodyBytes), err)
	}
	return respData, nil
}
