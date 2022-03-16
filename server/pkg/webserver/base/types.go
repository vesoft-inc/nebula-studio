package base

type StatusCode int

const (
	Error   StatusCode = -1
	Success StatusCode = 0
	// TODO: need to del it
	AuthorizationError StatusCode = 401
)
