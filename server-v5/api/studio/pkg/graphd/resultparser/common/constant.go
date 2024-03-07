package common

var methodSet = map[string]bool{
	"NULL":          true,
	"BOOL":          true,
	"INT8":          true,
	"INT16":         true,
	"INT32":         true,
	"INT64":         true,
	"UINT8":         true,
	"UINT16":        true,
	"UINT32":        true,
	"UINT64":        true,
	"FLOAT":         true,
	"DOUBLE":        true,
	"STRING":        true,
	"LIST":          true,
	"RECORD":        true,
	"DURATION":      true,
	"LOCALTIME":     true,
	"LOCALDATETIME": true,
	"DATE":          true,
	"ZONEDDATETIME": true,
	"ZONEDTIME":     true,
	"NODE":          true,
	"EDGE":          true,
	"PATH":          true,
}

func isProxyMethod(method string) bool {
	_, ok := methodSet[method]
	return ok
}
