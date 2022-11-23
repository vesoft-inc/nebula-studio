package importer

import (
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"

	"github.com/vesoft-inc/nebula-importer/pkg/cmd"
	"github.com/zeromicro/go-zero/core/logx"
)

type Task struct {
	Runner   *cmd.Runner  `json:"runner,omitempty"`
	TaskInfo *db.TaskInfo `json:"task_info,omitempty"`
}

func (t *Task) UpdateQueryStats() error {
	stats, err := t.Runner.QueryStats()
	if err != nil {
		logx.Infof("query import stats fail: %s", err)
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	t.TaskInfo.Stats = *stats
	return nil
}
