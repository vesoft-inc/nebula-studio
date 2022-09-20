package db

import "github.com/vesoft-inc/nebula-importer/pkg/stats"

type TaskInfo struct {
	ID            int         `json:"taskID" gorm:"primaryKey;autoIncrement"`
	Name          string      `json:"name"`
	Space         string      `json:"space"`
	NebulaAddress string      `json:"nebulaAddress"`
	CreatedTime   int64       `json:"createdTime"`
	UpdatedTime   int64       `json:"updatedTime"`
	User          string      `json:"user"`
	TaskStatus    string      `json:"taskStatus"`
	TaskMessage   string      `json:"taskMessage"`
	Stats         stats.Stats `json:"stats" gorm:"embedded"`
}
