package importer

import (
	"github.com/vesoft-inc/nebula-importer/pkg/cmd"

	"go.uber.org/zap"
)

type Task struct {
	runner   *cmd.Runner `json:"runner,omitempty"`
	TaskInfo *TaskInfo   `json:"task_info,omitempty"`
}

func (t *Task) UpdateQueryStats() error {
	stats, err := t.runner.QueryStats()
	if err != nil {
		zap.L().Warn("query import stats fail", zap.Error(err))
		return err
	}
	t.TaskInfo.Stats = *stats
	return nil
}
