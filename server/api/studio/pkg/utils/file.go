package utils

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func CreateDir(dir string) error {
	if _, err := os.Stat(dir); err != nil {
		if !os.IsNotExist(err) {
			return err
		}
		return os.MkdirAll(dir, os.ModePerm)
	}
	return nil
}

// read part of file: top 50 lines and bottom 50 lines
func ReadPartFile(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	defer file.Close()

	const (
		TopLineNum    = 1000
		BottomLineNum = 1000
	)
	var (
		topLines    []string
		bottomLines []string
		count       int
	)
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		count++
		line := scanner.Text()
		if count <= TopLineNum {
			topLines = append(topLines, line)
		} else {
			bottomLines = append(bottomLines, line)
			if len(bottomLines) > BottomLineNum {
				bottomLines = bottomLines[1:]
			}
		}
	}

	if err := scanner.Err(); err != nil && err != io.EOF {
		return nil, fmt.Errorf("read file error: %s", err)
	}

	hostname, err := os.Hostname()
	if err != nil || hostname == "" {
		hostname = "unknown"
	}
	absPath, err := os.Getwd()
	if err != nil {
		return nil, err
	}
	absPath = filepath.Join(absPath, path)

	if len(bottomLines) > 0 {
		if count > TopLineNum+BottomLineNum {
			ellipsis := fmt.Sprintf("\n...\n(%d lines more, original log file path: %s, hostname: %s)\n...\n", count-TopLineNum-BottomLineNum, absPath, hostname)
			topLines = append(topLines, ellipsis)
		}
		topLines = append(topLines, bottomLines...)
	}

	return topLines, nil
}
