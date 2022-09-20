package db

import (
	"time"
)

type Sketch struct {
	ID         int       `json:"id" gorm:"primaryKey;"`
	Name       string    `json:"name"`
	Schema     string    `json:"schema"`
	Snapshot   string    `json:"snapshot"`
	Host       string    `json:"host" gorm:"type:varchar(256);"`
	Username   string    `json:"username" gorm:"type:varchar(128);"`
	CreateTime time.Time `json:"create_time" gorm:"autoCreateTime"`
	UpdateTime time.Time `json:"update_time" gorm:"autoUpdateTime"`
}
