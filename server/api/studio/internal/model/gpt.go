package db

type ModelVersion string

const GPT3Dot5Turbo ModelVersion = "gpt3.5-turbo"
const GPT4 ModelVersion = "gpt4"

type APIType string

const Azure APIType = "azure"
const OpenAI APIType = "openai"

type GPTConfig struct {
	ID         int          `json:"ID" gorm:"primaryKey;autoIncrement"`
	URL        string       `json:"url"`
	Key        string       `json:"key"`
	GPTVersion ModelVersion `json:"gptVersion"`
	APIType    APIType      `json:"apiType"`
	Config     string       `json:"config"`
}
