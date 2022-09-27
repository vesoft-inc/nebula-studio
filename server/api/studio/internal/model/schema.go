package db

import (
	"time"
)

type SchemaSnapshot struct {
	ID         int       `json:"id" gorm:"primaryKey;"`
	Space      string    `json:"space"`
	Snapshot   string    `json:"snapshot"`
	Host       string    `json:"host" gorm:"type:varchar(256);"`
	Username   string    `json:"username" gorm:"type:varchar(128);"`
	CreateTime time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime time.Time `json:"update_time" gorm:"autoUpdateTime"`
}
