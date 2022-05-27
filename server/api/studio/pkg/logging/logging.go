package logging

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	levelStrings = map[string]zapcore.Level{
		"debug": zap.DebugLevel,
		"info":  zap.InfoLevel,
		"warn":  zap.WarnLevel,
		"error": zap.ErrorLevel,
	}
	encodingStrings = map[string]string{
		"json":    "json",
		"console": "console",
	}
)

type (
	Options struct {
		Development bool
		Level       zapcore.Level
		Encoding    string
	}
)

func NewOptions() *Options {
	return &Options{
		Development: false,
		Level:       zap.InfoLevel,
		Encoding:    "console",
	}
}

func (o *Options) InitGlobals() error {
	cfg := zap.NewProductionConfig()
	cfg.Level = zap.NewAtomicLevelAt(o.Level)
	cfg.Encoding = o.Encoding
	cfg.Development = o.Development

	l, err := cfg.Build()
	if err != nil {
		return err
	}
	zap.ReplaceGlobals(l)
	return nil
}
