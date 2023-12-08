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

type Qwen struct {
}

func (o *Qwen) HandleRequest(req map[string]any, config *db.LLMConfig) (*http.Request, error) {
	configs := make(map[string]any)
	qwenReq := make(map[string]any)
	err := json.Unmarshal([]byte(config.Config), &configs)
	if err == nil {
		qwenReq["model"] = configs["model"]
	}
	input := make(map[string]any)
	input["prompt"] = req["prompt"]
	input["messages"] = req["messages"]
	params := make(map[string]any)
	for k, v := range req {
		if k != "prompt" && k != "messages" {
			params[k] = v
		}
	}
	params["result_format"] = "message"
	qwenReq["input"] = input
	qwenReq["parameters"] = params

	// Convert the request parameters to a JSON string
	reqJSON, err := json.Marshal(qwenReq)
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
	if req["stream"] == true {
		httpReq.Header.Set("Accept", "text/event-stream")
	}
	return httpReq, nil
}

func (o *Qwen) HandleResponse(resp *http.Response, callback func(str string)) (map[string]any, error) {
	// Check if the response is a server-sent event str
	if strings.Contains(resp.Header.Get("Content-Type"), "text/event-stream") {
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

	respData["choices"] = respData["output"].(map[string]any)["choices"]
	usage := respData["usage"].(map[string]any)
	usage["completion_tokens"] = usage["output_tokens"]
	usage["prompt_tokens"] = usage["input_tokens"]
	return respData, nil
}
