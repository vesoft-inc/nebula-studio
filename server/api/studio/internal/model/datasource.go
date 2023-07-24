package db

import (
	"time"

	"gorm.io/gorm"
)

type Datasource struct {
	ID         int       `gorm:"column:id;primaryKey;autoIncrement"`
	BID        string    `gorm:"column:b_id;not null;type:char(32);uniqueIndex;comment:datasource id"`
	Name       string    `gorm:"column:name;type:varchar(128);not null"`
	Type       string    `gorm:"column:type;type:varchar(128);not null"`
	Platform   string    `gorm:"column:platform;type:varchar(128);not null"`
	Config     string    `gorm:"column:config;type:text;not null"`
	Secret     string    `gorm:"column:secret;type:varchar(128);not null"`
	Host       string    `gorm:"column:host;type:varchar(128);not null"`
	Username   string    `gorm:"column:username;type:varchar(128);not null"`
	CreateTime time.Time `gorm:"column:create_time;type:datetime;autoCreateTime"`

	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index;type:datetime"`
}
