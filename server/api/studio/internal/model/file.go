package db

import (
	"time"
)

type File struct {
	ID         int       `gorm:"column:id;primaryKey;autoIncrement"`
	BID        string    `gorm:"column:b_id;not null;type:char(32);uniqueIndex;comment:file id"`
	Name       string    `gorm:"column:name;type:varchar(128);unique"`
	WithHeader bool      `gorm:"column:with_header;type:boolean;default:false;"`
	Delimiter  string    `gorm:"column:delimiter;default:',';"`
	Host       string    `gorm:"column:host;type:varchar(128);not null"`
	Username   string    `gorm:"column:username;type:varchar(128);not null"`
	CreateTime time.Time `gorm:"column:create_time;type:datetime;autoCreateTime"`
	UpdateTime time.Time `gorm:"column:update_time;type:datetime;autoUpdateTime"`
}
