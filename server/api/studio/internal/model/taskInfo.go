package db

import (
	"time"
)

type Stats struct {
	ProcessedBytes  int64         `gorm:"column:processed_bytes;"`
	TotalBytes      int64         `gorm:"column:total_bytes;"`
	FailedRecords   int64         `gorm:"column:failed_records;"`
	TotalRecords    int64         `gorm:"column:total_records;"`
	FailedRequest   int64         `gorm:"column:failed_request;"`
	TotalRequest    int64         `gorm:"column:total_request;"`
	TotalLatency    time.Duration `gorm:"column:total_latency;"`
	TotalRespTime   time.Duration `gorm:"column:total_resp_time;"`
	FailedProcessed int64         `gorm:"column:failed_processed;"`
	TotalProcessed  int64         `gorm:"column:total_processed;"`
}

type TaskInfo struct {
	ID            int    `gorm:"column:id;primaryKey;autoIncrement;"`
	BID           string `gorm:"column:b_id;not null;type:char(32);uniqueIndex;comment:task id"`
	Address       string `gorm:"column:address;type:varchar(255);"`
	Name          string `gorm:"column:name;type:varchar(255);"`
	Space         string `gorm:"column:space;type:varchar(255);"`
	ImportAddress string `gorm:"column:import_address;"`
	User          string `gorm:"column:user;"`
	TaskStatus    string `gorm:"column:task_status;"`
	TaskMessage   string `gorm:"column:task_message;"`
	Stats         Stats  `gorm:"embedded"`
	RawConfig     string `gorm:"column:raw_config;type:mediumtext;"`

	CreateTime time.Time `gorm:"column:create_time;type:datetime;autoCreateTime"`
	UpdateTime time.Time `gorm:"column:update_time;type:datetime;autoUpdateTime"`
}

// storage for task yaml config and partial task log
type TaskEffect struct {
	ID     int    `gorm:"column:id;primaryKey;autoIncrement;"`
	BID    string `gorm:"column:task_id;not null;type:char(32);uniqueIndex;comment:task id"`
	Log    string `gorm:"column:log;type:mediumtext;comment:partial task log"`
	Config string `gorm:"column:config;type:mediumtext;comment:task config.yaml"`

	CreateTime time.Time `gorm:"column:create_time;type:datetime;autoCreateTime"`
}
