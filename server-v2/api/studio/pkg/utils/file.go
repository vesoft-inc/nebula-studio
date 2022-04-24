package utils

import "os"

func CreateDir(dir string) error {
	if _, err := os.Stat(dir); err != nil {
		if !os.IsNotExist(err) {
			return err
		}
		return os.MkdirAll(dir, os.ModePerm)
	}
	return nil
}
