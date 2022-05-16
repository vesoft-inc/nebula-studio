package importer

import (
	"github.com/vesoft-inc/nebula-importer/pkg/cmd"
	"github.com/zeromicro/go-zero/core/logx"
)

type Task struct {
	runner   *cmd.Runner `json:"runner,omitempty"`
	TaskInfo *TaskInfo   `json:"task_info,omitempty"`
}

func (t *Task) UpdateQueryStats() error {
	stats, err := t.runner.QueryStats()
	if err != nil {
		logx.Infof("query import stats fail: %s", err)
		return err
	}
	t.TaskInfo.Stats = *stats
	return nil
}
