package importer

import (
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"

	"github.com/vesoft-inc/nebula-importer/v4/pkg/config"
	"github.com/vesoft-inc/nebula-importer/v4/pkg/logger"
	"github.com/vesoft-inc/nebula-importer/v4/pkg/manager"
)

type Client struct {
	Cfg        config.Configurator `json:"cfg,omitempty"`
	Logger     logger.Logger       `json:"logger,omitempty"`
	Manager    manager.Manager     `json:"manager,omitempty"`
	HasStarted bool                `json:"has_started,omitempty"`
}
type Task struct {
	Client   *Client      `json:"client,omitempty"`
	TaskInfo *db.TaskInfo `json:"task_info,omitempty"`
}

func (t *Task) UpdateQueryStats() error {
	if (t.Client == nil) || (t.Client.Manager == nil) {
		return nil
	}
	stats := t.Client.Manager.Stats()
	t.TaskInfo.Stats = db.Stats{
		ProcessedBytes:  stats.ProcessedBytes,
		TotalBytes:      stats.TotalBytes,
		FailedRecords:   stats.FailedRecords,
		TotalRecords:    stats.TotalRecords,
		FailedRequest:   stats.FailedRequest,
		TotalRequest:    stats.TotalRequest,
		TotalLatency:    stats.TotalLatency,
		TotalRespTime:   stats.TotalRespTime,
		FailedProcessed: stats.FailedProcessed,
		TotalProcessed:  stats.TotalProcessed,
	}
	return nil
}
