package ecode

import (
	"net/http"
)

const (
	// TODO: Please modify it to your own platform code.
	PlatformCode = 4
)

// Define you error code here
var (
	ErrBadRequest     = newErrCode(CCBadRequest, PlatformCode, 0, "ErrBadRequest")         // 4000000
	ErrParam          = newErrCode(CCBadRequest, PlatformCode, 1, "ErrParam")              // 4000001
	ErrUnauthorized   = newErrCode(CCUnauthorized, PlatformCode, 0, "ErrUnauthorized")     // 4010000
	ErrSession        = newErrCode(CCUnauthorized, PlatformCode, 1, "ErrSession")          // 4010001
	ErrForbidden      = newErrCode(CCForbidden, PlatformCode, 0, "ErrForbidden")           // 4030000
	ErrNotFound       = newErrCode(CCNotFound, PlatformCode, 0, "ErrNotFound")             // 4040000
	ErrInternalServer = newErrCode(CCInternalServer, PlatformCode, 0, "ErrInternalServer") // 5000000
	ErrNotImplemented = newErrCode(CCNotImplemented, PlatformCode, 0, "ErrNotImplemented") // 5010000
	ErrUnknown        = newErrCode(CCUnknown, PlatformCode, 0, "ErrUnknown")               // 9000000
)

var statusCodeErrorMapping = map[int]*ErrCode{
	http.StatusBadRequest:          ErrBadRequest,
	http.StatusUnauthorized:        ErrUnauthorized,
	http.StatusForbidden:           ErrForbidden,
	http.StatusNotFound:            ErrNotFound,
	http.StatusInternalServerError: ErrInternalServer,
	http.StatusNotImplemented:      ErrNotImplemented,
}

func GetErrCodeByHTTPStatus(httpStatus int) *ErrCode {
	if c, ok := statusCodeErrorMapping[httpStatus]; ok {
		return c
	}
	return ErrInternalServer
}

func WithBadRequest(err error, formatWithArgs ...interface{}) error {
	return WithCode(ErrBadRequest, err, formatWithArgs...)
}

func WithUnauthorized(err error, formatWithArgs ...interface{}) error {
	return WithCode(ErrUnauthorized, err, formatWithArgs...)
}

func WithForbidden(err error, formatWithArgs ...interface{}) error {
	return WithCode(ErrForbidden, err, formatWithArgs...)
}

func WithNotFound(err error, formatWithArgs ...interface{}) error {
	return WithCode(ErrNotFound, err, formatWithArgs...)
}

func WithInternalServer(err error, formatWithArgs ...interface{}) error {
	return WithCode(ErrInternalServer, err, formatWithArgs...)
}

func WithNotImplemented(err error, formatWithArgs ...interface{}) error {
	return WithCode(ErrNotImplemented, err, formatWithArgs...)
}

func WithUnknown(err error, formatWithArgs ...interface{}) error {
	return WithCode(ErrUnknown, err, formatWithArgs...)
}

func IsBadRequest(err error) bool {
	return IsCodeError(err, ErrBadRequest)
}

func IsUnauthorized(err error) bool {
	return IsCodeError(err, ErrUnauthorized)
}

func IsForbidden(err error) bool {
	return IsCodeError(err, ErrForbidden)
}

func IsNotFound(err error) bool {
	return IsCodeError(err, ErrNotFound)
}

func IsInternalServer(err error) bool {
	return IsCodeError(err, ErrInternalServer)
}

func IsNotImplemented(err error) bool {
	return IsCodeError(err, ErrNotImplemented)
}

func IsUnknown(err error) bool {
	return IsCodeError(err, ErrUnknown)
}
