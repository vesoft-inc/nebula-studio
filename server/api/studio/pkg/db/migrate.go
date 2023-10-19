package db

import (
	"fmt"

	"gorm.io/gorm"
)

func ColumnExists(db *gorm.DB, tableName string, columnName string) (bool, error) {
	// mysql | postgres
	query := "SELECT count(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = ? AND column_name = ?"

	dbType := db.Dialector.Name()
	// sqlite does not support `INFORMATION_SCHEMA`, so we need to use `PRAGMA table_info`
	if dbType == "sqlite" {
		query = fmt.Sprintf("PRAGMA table_info(%s)", tableName)
	}

	rows, err := db.Raw(query, tableName, columnName).Rows()
	if err != nil {
		return false, err
	}
	defer rows.Close()

	for rows.Next() {
		if dbType == "sqlite" {
			var cid, pk int
			var name, dataType, dflt_value string
			var notnull bool
			/*
				| cid | name | type         | notnull | dflt_value | pk |
				|-----|------|--------------|---------|------------|----|
				| 0   | id   | INTEGER      | 0       | NULL       | 1  |
				| 1   | b_id | char(32)     | 1       | NULL       | 0  |
				| 2   | name | varchar(255) | 1       | NULL       | 0  |
			*/
			rows.Scan(&cid, &name, &dataType, &notnull, &dflt_value, &pk)
			if name == columnName {
				return true, nil
			}
		} else {
			var count int
			rows.Scan(&count)
			if count > 0 {
				return true, nil
			}
		}
	}

	return false, nil
}

// Add the `b_id“ field to certain database tables for versions prior to v3.7 (inclusive).
// We need to perform this operation manually, otherwise the `db.AutoMigrate` method will throw an exception
func MigrateAlterBID(db *gorm.DB, tables []string) error {
	for _, table := range tables {
		isTableExist := db.Migrator().HasTable(table)
		// if table not exists, skip
		if !isTableExist {
			continue
		}

		isColumnExist, err := ColumnExists(db, table, "b_id")
		if err != nil {
			return err
		}
		// if column exists, skip
		if isColumnExist {
			continue
		}

		err = db.Exec("ALTER TABLE `" + table + "` ADD COLUMN `b_id` CHAR(32) NOT NULL DEFAULT ''").Error
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
