package db

import (
	"time"

	"gorm.io/gorm"
)

type DatasourceGrant struct {
	ID              int       `gorm:"column:id;primaryKey;autoIncrement"`
	DatasourceBID   string    `gorm:"column:datasource_b_id;not null;type:char(32);uniqueIndex:idx_datasource_grant_unique"`
	GranteeUsername string    `gorm:"column:grantee_username;type:varchar(128);not null;uniqueIndex:idx_datasource_grant_unique"`
	Host            string    `gorm:"column:host;type:varchar(128);not null;index"`
	CreateTime      time.Time `gorm:"column:create_time;type:datetime;autoCreateTime"`

	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index;type:datetime"`
}
