package ecode

import (
	"github.com/vesoft-inc/go-pkg/errorx"
)

const (
	// CodeCategory
	CCBadRequest     = errorx.CCBadRequest     // 400
	CCUnauthorized   = errorx.CCUnauthorized   // 401
	CCForbidden      = errorx.CCForbidden      // 403
	CCNotFound       = errorx.CCNotFound       // 404
	CCInternalServer = errorx.CCInternalServer // 500
	CCNotImplemented = errorx.CCNotImplemented // 501
	CCUnknown        = errorx.CCUnknown        // 900
)

var (
	// WithCode return error warps with codeError.
	// c is the code. err is the real err. formatWithArgs is format string with args.
	// For example:
	//  WithCode(ErrBadRequest, nil)
	//  WithCode(ErrBadRequest, err)
	//  WithCode(ErrBadRequest, err, "message")
	//  WithCode(ErrBadRequest, err, "message %s", "id")
	WithCode         = errorx.WithCode
	AsCodeError      = errorx.AsCodeError
	IsCodeError      = errorx.IsCodeError
	SeparateCode     = errorx.SeparateCode
	TakeCodePriority = errorx.TakeCodePriority

	// newErrCode is create an new *ErrCode, it's only used for global initialization.
	// Do not export so that it cannot be used outside of this package.
	newErrCode = errorx.NewErrCode
)

type (
	// ErrCode is the error code for app
	// 0 indicates success, others indicate failure.
	// It is combined of error category code, platform code, and specific code via CodeCombiner.
	// The default CodeCombiner's rules are as follows:
	// - The first three digits represent the category code, analogous to the http status code.
	// - The next two digits indicate the platform code.
	// - The last three digits indicate the specific code.
	//   For example:
	//     4041001:
	// 	     404 is the error category code
	// 	      10 is the error platform code
	// 	     001 is the error specific code
	ErrCode   = errorx.ErrCode
	CodeError = errorx.CodeError
)
