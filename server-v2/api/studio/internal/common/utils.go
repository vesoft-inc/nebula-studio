package common

import (
	"regexp"
	"strings"
)

var (
	ReserveRequestRoutes = []string{
		"/api-nebula/db/disconnect",
		"/api/files",
		"/api/import-tasks",
	}
	ReserveResponseRoutes = []string{
		"/api-nebula/db/connect",
		"/api-nebula/db/disconnect",
		"/api/import-tasks",
	}
	IgnoreHandlerBodyPatterns = []*regexp.Regexp{
		regexp.MustCompile(`^/api/import-tasks/\d+/download`),
	}
)

func PathHasPrefix(path string, routes []string) bool {
	for _, route := range routes {
		if strings.HasPrefix(path, route) {
			return true
		}
	}
	return false
}

func PathMatchPattern(path string, patterns []*regexp.Regexp) bool {
	for _, pattern := range patterns {
		if pattern.MatchString(path) {
			return true
		}
	}
	return false
}
