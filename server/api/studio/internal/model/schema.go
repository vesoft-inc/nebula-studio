package db

import (
	"time"

	"gorm.io/gorm"
)

type SchemaSnapshot struct {
	ID         int       `gorm:"column:id;primaryKey;autoIncrement"`
	BID        string    `gorm:"column:b_id;not null;type:char(32);uniqueIndex;comment:schema snapshot id"`
	Space      string    `gorm:"column:space;type:varchar(255);not null"`
	Snapshot   string    `gorm:"column:snapshot;type:text;not null"`
	Host       string    `gorm:"column:host;type:varchar(256);not null"`
	Username   string    `gorm:"column:username;type:varchar(128);not null"`
	CreateTime time.Time `gorm:"column:create_time;type:datetime;autoCreateTime"`
	UpdateTime time.Time `gorm:"column:update_time;type:datetime;autoUpdateTime"`

	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index;type:datetime"`
}
