package svc

import (
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/config"
)

type ServiceContext struct {
	Config config.Config
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config: c,
	}
}
