package db

import (
	"time"

	"gorm.io/datatypes"
)

type LLMJob struct {
	ID                int            `json:"id" gorm:"primaryKey;autoIncrement"`
	UserName          string         `json:"user_name" gorm:"index:"`
	Host              string         `json:"host" gorm:"index"`
	JobID             string         `json:"job_id" gorm:"index:,unique"`
	Space             string         `json:"space"`
	SpaceSchemaString string         `json:"space_schema_string"`
	File              string         `json:"file"`
	JobType           string         `json:"job_type"`
	Status            LLMStatus      `json:"status"`
	PromptTemplate    string         `json:"prompt_template"`
	Process           datatypes.JSON `json:"process"`
	CreateTime        time.Time      `json:"create_time" gorm:"column:create_time;type:datetime;autoCreateTime"`
	UpdateTime        time.Time      `json:"update_ime" gorm:"column:update_time;type:datetime;autoUpdateTime"`
}

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
