package db

import (
	"time"

	"github.com/vesoft-inc/nebula-importer/v4/pkg/stats"
)

type TaskInfo struct {
	ID            int         `json:"taskID" gorm:"primaryKey;autoIncrement"`
	Address       string      `json:"address"`
	Name          string      `json:"name"`
	Space         string      `json:"space"`
	ImportAddress string      `json:"importAddress"`
	CreateTime    time.Time   `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime    time.Time   `json:"update_time" gorm:"autoUpdateTime"`
	User          string      `json:"user"`
	TaskStatus    string      `json:"taskStatus"`
	TaskMessage   string      `json:"taskMessage"`
	Stats         stats.Stats `json:"stats" gorm:"embedded"`
}
