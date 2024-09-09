package ecode

import (
	"fmt"
	"net/http"
)

const (
	// TODO: Please modify it to your own platform code.
	PlatformCode = 4
)

// Define you error code here
var (
	ErrBadRequest       = newErrCode(CCBadRequest, PlatformCode, 0, "ErrBadRequest")           // 40004000
	ErrParam            = newErrCode(CCBadRequest, PlatformCode, 1, "ErrParam")                // 40004001
	ErrUnauthorized     = newErrCode(CCUnauthorized, PlatformCode, 0, "ErrUnauthorized")       // 40104000
	ErrSession          = newErrCode(CCUnauthorized, PlatformCode, 1, "ErrSession")            // 40104001
	ErrForbidden        = newErrCode(CCForbidden, PlatformCode, 0, "ErrForbidden")             // 40304000
	ErrInvalidParameter = newErrCode(CCForbidden, PlatformCode, 1, "ErrInvalidParameter")      // 40304001
	ErrNotFound         = newErrCode(CCNotFound, PlatformCode, 0, "ErrNotFound")               // 40404000
	ErrInternalServer   = newErrCode(CCInternalServer, PlatformCode, 0, "ErrInternalServer")   // 50004000
	ErrInternalDatabase = newErrCode(CCInternalServer, PlatformCode, 1, "ErrInternalDatabase") // 50004001
	ErrNotImplemented   = newErrCode(CCNotImplemented, PlatformCode, 0, "ErrNotImplemented")   // 50104000
	ErrUnknown          = newErrCode(CCUnknown, PlatformCode, 0, "ErrUnknown")                 // 90004000
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

func WithSessionMessage(err error, formatWithArgs ...interface{}) error {
	return WithErrorMessage(ErrSession, err, formatWithArgs...)
}

func WithErrorMessage(c *ErrCode, err error, formatWithArgs ...interface{}) error {
	ErrWithMessage := newErrCode(c.GetCategoryCode(), c.GetPlatformCode(), c.GetSpecificCode(), fmt.Sprintf("%s::%s", c.GetMessage(), err.Error()))
	return WithCode(ErrWithMessage, err, formatWithArgs...)
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
