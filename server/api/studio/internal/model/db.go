package db

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/zeromicro/go-zero/core/logx"
	"go.uber.org/zap"
	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var CtxDB *gorm.DB

func parseDSN(opts config.Config) (dsn string, err error) {
	switch opts.DB.Type {
	case "mysql":
		concate := "?"
		if strings.Contains(opts.Name, concate) {
			concate = "&"
		}
		if opts.Host[0] == '/' {
			dsn = fmt.Sprintf("%s:%s@unix(%s)/%s%scharset=utf8mb4&parseTime=true&loc=Local",
				opts.DB.User, opts.DB.Password, opts.Host, opts.Name, concate)
		} else {
			dsn = fmt.Sprintf("%s:%s@tcp(%s)/%s%scharset=utf8mb4&parseTime=true&loc=Local",
				opts.DB.User, opts.DB.Password, opts.DB.Host, opts.DB.Name, concate)
		}

	case "sqlite3":
		dsn = "file:" + opts.DB.SqliteDbFilePath + "?cache=shared&mode=rwc&synchronous=off&busy_timeout=10000&journal_mode=wal"

	default:
		return "", errors.Errorf("unrecognized dialect: %s", opts.DB.Type)
	}

	return dsn, nil
}

func openDB(opts config.Config) (*gorm.DB, error) {
	logx.Info(opts)
	dsn, err := parseDSN(opts)
	if err != nil {
		return nil, errors.Wrap(err, "parse DSN")
	}

	var dialector gorm.Dialector
	switch opts.DB.Type {
	case "mysql":
		dialector = mysql.Open(dsn)
	case "sqlite3":
		dialector = sqlite.Open(dsn)
	}

	cfg := &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		SkipDefaultTransaction:                   true,
		Logger: logger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags),
			logger.Config{
				SlowThreshold:             200 * time.Millisecond,
				LogLevel:                  logger.LogLevel(opts.DB.LogLevel),
				IgnoreRecordNotFoundError: opts.DB.IgnoreRecordNotFoundError,
				Colorful:                  true,
			},
		),
	}

	db, err := gorm.Open(dialector, cfg)
	if opts.DB.Type == "mysql" {
		db.Set("gorm:table_options", "ENGINE=InnoDB")
	}
	return db, err
}

/*
`InitDB` initialize local sql by open sql and create task_infos table
*/
func InitDB(config *config.Config, db *gorm.DB) {
	if db == nil {
		var err error
		db, err = openDB(*config)
		if err != nil {
			zap.L().Fatal(fmt.Sprintf("init db fail: %s", err))
			panic(err)
		}

		sqlDB, err := db.DB()
		if err != nil {
			zap.L().Fatal(fmt.Sprintf("init db fail: %v", err))
			panic(err)
		}

		sqlDB.SetMaxOpenConns(config.DB.MaxOpenConns)
		sqlDB.SetMaxIdleConns(config.DB.MaxIdleConns)
		sqlDB.SetConnMaxIdleTime(time.Hour)
	}

	if config.DB.AutoMigrate {
		err := db.AutoMigrate(
			&Datasource{},
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
	}

	CtxDB = db
}
