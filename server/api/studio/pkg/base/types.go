package base

type StatusCode int

type Result interface{}

const (
	Error   StatusCode = -1
	Success StatusCode = 0
)

type Process struct {
	TotalSize        int     `json:"total"`
	CurrentSize      int     `json:"current"`
	Ratio            float64 `json:"ratio"`
	FailedReason     string  `json:"failed_reason"`
	PromptTokens     int     `json:"prompt_tokens"`
	CompletionTokens int     `json:"completion_tokens"`
}

type LLMStatus string

const (
	LLMStatusRunning LLMStatus = "running"
	LLMStatusSuccess LLMStatus = "success"
	LLMStatusFailed  LLMStatus = "failed"
	LLMStatusCancel  LLMStatus = "cancel"
	LLMStatusPending LLMStatus = "pending"
)

type LLMJobType string

const (
	LLMJobTypeFile     LLMJobType = "file"
	LLMJobTypeFilePath LLMJobType = "file_path"
)
