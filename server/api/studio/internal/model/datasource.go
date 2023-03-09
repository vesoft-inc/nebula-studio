package db

import "time"

type Datasource struct {
	ID         int       `json:"id" gorm:"primaryKey;autoIncrement"`
	Name       string    `json:"name"`
	Type       string    `json:"type"`
	Config     string    `json:"config"`
	Secret     string    `json:"secret"`
	Host       string    `json:"host"`
	Username   string    `json:"username"`
	CreateTime time.Time `json:"create_time" gorm:"autoCreateTime"`
}
