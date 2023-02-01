package db

import "github.com/vesoft-inc/nebula-importer/pkg/stats"

type TaskInfo struct {
	ID            int         `json:"taskID" gorm:"primaryKey;autoIncrement"`
	Address       string      `json:"address"`
	Name          string      `json:"name"`
	Space         string      `json:"space"`
	ImportAddress string      `json:"importAddress"`
	CreatedTime   int64       `json:"createdTime"`
	UpdatedTime   int64       `json:"updatedTime"`
	User          string      `json:"user"`
	TaskStatus    string      `json:"taskStatus"`
	TaskMessage   string      `json:"taskMessage"`
	Stats         stats.Stats `json:"stats" gorm:"embedded"`
}
