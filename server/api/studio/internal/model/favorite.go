package db

import (
	"time"
)

type Favorite struct {
	ID         int       `json:"taskID" gorm:"primaryKey;autoIncrement"`
	Content    string    `json:"content"`
	Host       string    `json:"host" gorm:"type:varchar(256);"`
	Username   string    `json:"username" gorm:"type:varchar(128);"`
	CreateTime time.Time `json:"create_time" gorm:"autoCreateTime"`
}
