package client

import (
	nebula "github.com/vesoft-inc/nebula-go/v3"
	"github.com/zeromicro/go-zero/core/logx"
)

var _ nebula.Logger = nebulaLogger{}

type nebulaLogger struct{}

func newNebulaLogger() nebula.Logger {
	return nebulaLogger{}
}

//revive:disable:empty-lines

func (l nebulaLogger) Info(msg string)  { logx.Infof(msg) }
func (l nebulaLogger) Warn(msg string)  { logx.Infof("[WARNING] %s", msg) }
func (l nebulaLogger) Error(msg string) { logx.Errorf(msg) }
func (l nebulaLogger) Fatal(msg string) { logx.Infof("[FATAL] %s", msg) }

//revive:enable:empty-lines
