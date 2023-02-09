package db

import (
	"time"
)

type File struct {
	ID         int       `json:"ID" gorm:"primaryKey;autoIncrement"`
	Name       string    `json:"name"`
	WithHeader bool      `json:"withHeader" gorm:"default:false;"`
	Delimiter  string    `json:"delimiter" gorm:"default:',';"`
	Host       string    `json:"host" gorm:"type:varchar(256);"`
	Username   string    `json:"username" gorm:"type:varchar(128);"`
	CreateTime time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime time.Time `json:"update_time" gorm:"autoUpdateTime"`
}
