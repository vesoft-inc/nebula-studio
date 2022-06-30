package utils

import (
	"context"

	"github.com/vesoft-inc/go-pkg/errorx"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/pkg/ecode"
	"github.com/zeromicro/go-zero/core/logx"
)

type WithErrorMessage func(c *errorx.ErrCode, err error, formatWithArgs ...interface{}) error

func ErrMsgWithLogger(ctx context.Context) WithErrorMessage {
	logger := logx.WithContext(ctx)
	return func(c *errorx.ErrCode, err error, formatWithArgs ...interface{}) error {
		logger.Errorf(err.Error(), formatWithArgs...)
		return ecode.WithErrorMessage(c, err, formatWithArgs...)
	}
}
