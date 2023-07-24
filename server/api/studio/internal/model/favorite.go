package db

import (
	"time"

	"gorm.io/gorm"
)

type Favorite struct {
	ID         int       `gorm:"column:id;primaryKey;autoIncrement"`
	BID        string    `gorm:"column:b_id;not null;type:char(32);uniqueIndex;comment:favorite id"`
	Content    string    `gorm:"column:content;type:varchar(255);not null"`
	Host       string    `gorm:"column:host;type:varchar(128);not null"`
	Username   string    `gorm:"column:username;type:varchar(128);not null"`
	CreateTime time.Time `gorm:"column:create_time;type:datetime;autoCreateTime"`

	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index;type:datetime"`
}
