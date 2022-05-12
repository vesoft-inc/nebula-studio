package base

type StatusCode int

type Result interface{}

const (
	Error   StatusCode = -1
	Success StatusCode = 0
)
