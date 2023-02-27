package svc

import (
	"context"
	"database/sql"
	"errors"
	"net/http"

	"github.com/vesoft-inc/go-pkg/httpclient"
	"github.com/vesoft-inc/go-pkg/response"
	"github.com/vesoft-inc/go-pkg/validator"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/core/logx"
)

type ServiceContext struct {
	Config          config.Config
	ResponseHandler response.Handler
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config:          c,
		ResponseHandler: createResponseHandler(c),
	}
}

func createResponseHandler(c config.Config) response.Handler { // nolint:gocritic
	return response.NewStandardHandler(response.StandardHandlerParams{
		GetErrCode: func(err error) *ecode.ErrCode {
			return ecode.TakeCodePriority(func() *ecode.ErrCode {
				if _, ok := err.(validator.ValidationErrors); ok {
					return ecode.ErrParam
				}
				return nil
			}, func() *ecode.ErrCode {
				if errors.Is(err, sql.ErrNoRows) {
					return ecode.ErrNotFound
				}
				return nil
			}, func() *ecode.ErrCode {
				if e, ok := httpclient.AsResponseError(err); ok {
					return ecode.GetErrCodeByHTTPStatus(e.GetResponse().StatusCode())
				}
				return nil
			}, func() *ecode.ErrCode {
				return ecode.ErrInternalServer
			})
		},
		ContextErrorf: func(ctx context.Context, format string, a ...interface{}) {
			logx.WithContext(ctx).Errorf(format, a...)
		},
		CheckBodyType: func(r *http.Request) response.StandardHandlerBodyType {
			if utils.PathMatchPattern(r.URL.Path, utils.IgnoreHandlerBodyPatterns) {
				return response.StandardHandlerBodyNone
			}
			return response.StandardHandlerBodyJson
		},
	})
}
