package db

import (
	"gorm.io/gorm"
)

// Add the `b_id“ field to certain database tables for versions prior to v3.7 (inclusive).
// We need to perform this operation manually, otherwise the `db.AutoMigrate` method will throw an exception
func MigrateAlterBID(db *gorm.DB, tables []string) error {
	for _, table := range tables {
		isTableExist := db.Migrator().HasTable(table)
		// if table not exists, skip
		if !isTableExist {
			continue
		}
		isColumnExist := db.Migrator().HasColumn(table, "b_id")
		if isColumnExist {
			continue
		}
		err := db.Exec("ALTER TABLE `" + table + "` ADD COLUMN `b_id` CHAR(32) NOT NULL DEFAULT ''").Error
		if err != nil {
			return err
		}
		err = db.Exec("UPDATE `" + table + "` SET `b_id` = `id`").Error
		if err != nil {
			return err
		}
	}
	return nil
}
