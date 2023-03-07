package importer

import (
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"

	"github.com/vesoft-inc/nebula-importer/v4/pkg/config"
	"github.com/vesoft-inc/nebula-importer/v4/pkg/logger"
	"github.com/vesoft-inc/nebula-importer/v4/pkg/manager"
)

type Client struct {
	Cfg     config.Configurator `json:"cfg,omitempty"`
	Logger  logger.Logger       `json:"logger,omitempty"`
	Manager manager.Manager     `json:"manager,omitempty"`
}
type Task struct {
	Client   Client       `json:"client,omitempty"`
	TaskInfo *db.TaskInfo `json:"task_info,omitempty"`
}

func (t *Task) UpdateQueryStats() error {
	stats := t.Client.Manager.Stats()
	t.TaskInfo.Stats = *stats
	return nil
}
