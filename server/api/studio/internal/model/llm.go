package db

type ModelVersion string

const LLM3Dot5Turbo ModelVersion = "llm3.5-turbo"
const LLM4 ModelVersion = "llm4"

type APIType string

const OpenAI APIType = "openai"

type LLMConfig struct {
	ID                 int     `json:"" gorm:"primaryKey;autoIncrement"`
	URL                string  `json:"url"`
	Key                string  `json:"key"`
	APIType            APIType `json:"apiType"`
	ContextLengthLimit int     `json:"contextLengthLimit"`
	Config             string  `json:"config"`
	Host               string  `json:"host"`
	UserName           string  `json:"userName"`
}
