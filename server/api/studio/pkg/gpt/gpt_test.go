package gpt

import (
	"log"
	"testing"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
)

func TestInit(t *testing.T) {
	Config.APIType = db.Azure
	Config.GPTVersion = db.GPT3Dot5Turbo
	Config.Key = "4d93ecc9305a4b0487cee880258aea19"
	Config.URL = "https://vesoft.openai.azure.com/openai/deployments/ding_chatbot/chat/completions?api-version=2023-03-15-preview"
	res, _ := Fetch(map[string]any{
		"stream":      true,
		"temperature": 0.7,
		"messages": []any{
			map[string]any{
				"role":    "system",
				"content": "You are a helpful assistant.",
			},
			map[string]any{
				"role":    "user",
				"content": "Does Azure OpenAI support customer managed keys?",
			},
			map[string]any{
				"role":    "assistant",
				"content": "Yes, customer managed keys are supported by Azure OpenAI.",
			},
			map[string]any{
				"role":    "user",
				"content": "Do other Azure Cognitive Services support this too?",
			},
		},
	}, func(str string) {
		log.Print(str)
	})
	t.Log(res)
	t.Log("test_init success")
}
