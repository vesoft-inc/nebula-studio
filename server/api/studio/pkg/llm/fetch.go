package llm

import (
	"fmt"
	"net/http"
	"time"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/llm/transformer"
)

func Fetch(auth *auth.AuthData, req map[string]any, callback func(str string)) (map[string]any, error) {
	var config = db.LLMConfig{
		Host:     auth.Address,
		UserName: auth.Username,
	}
	err := db.CtxDB.First(&config).Error
	if err != nil {
		return nil, err
	}
	return FetchWithLLMConfig(&config, req, callback)
}

func FetchWithLLMConfig(config *db.LLMConfig, req map[string]any, callback func(str string)) (map[string]any, error) {

	// Convert the request parameters to a JSON string
	var transform transformer.Handler
	if config.APIType == "openai" {
		transform = &transformer.OpenAI{}
	} else if config.APIType == "qwen" {
		transform = &transformer.Qwen{}
	}
	httpReq, err := transform.HandleRequest(req, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create HTTP request: %v", err)
	}
	// Send the HTTP request
	client := &http.Client{
		Timeout: 180 * time.Second,
	}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send HTTP request: %v", err)
	}
	defer resp.Body.Close()
	defer client.CloseIdleConnections()
	return transform.HandleResponse(resp, callback)
}

type Document struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Url     string `json:"url"`
}
