package db

import (
	"fmt"

	"go.uber.org/zap"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var CtxDB *gorm.DB

/*
`InitDB` initialize local sql by open sql and create task_infos table
*/
func InitDB(sqlitedbFilePath string) {
	dbFilePath := sqlitedbFilePath
	db, err := gorm.Open(sqlite.Open(dbFilePath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		zap.L().Fatal(fmt.Sprintf("init db fail: %s", err))
	}
	err = db.AutoMigrate(
		&TaskInfo{},
		&Sketch{},
		&SchemaSnapshot{},
		&Favorite{},
		&File{},
	)
	if err != nil {
		zap.L().Fatal(fmt.Sprintf("init taskInfo table fail: %s", err))
		panic(err)
	}
	CtxDB = db
}
