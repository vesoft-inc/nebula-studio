package db

import (
	"time"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
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
	Status            base.LLMStatus `json:"status"`
	PromptTemplate    string         `json:"prompt_template"`
	Process           datatypes.JSON `json:"process"`
	CreateTime        time.Time      `json:"create_time" gorm:"column:create_time;type:datetime;autoCreateTime"`
	UpdateTime        time.Time      `json:"update_ime" gorm:"column:update_time;type:datetime;autoUpdateTime"`
}
