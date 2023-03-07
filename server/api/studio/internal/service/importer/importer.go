package importer

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"time"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/zeromicro/go-zero/core/logx"
)

type ImportResult struct {
	TaskId      string `json:"taskId"`
	TimeCost    string `json:"timeCost"` // Milliseconds
	FailedRows  int64  `json:"failedRows"`
	ErrorResult struct {
		ErrorCode int    `json:"errorCode"`
		ErrorMsg  string `json:"errorMsg"`
	}
}

func StartImport(taskID string) (err error) {
	task, _ := GetTaskMgr().GetTask(taskID)
	signal := make(chan struct{}, 1)

	abort := func() {
		task.TaskInfo.TaskStatus = StatusAborted.String()
		task.TaskInfo.TaskMessage = err.Error()
		err = GetTaskMgr().AbortTask(taskID)
		if err != nil {
			logx.Errorf("start task fail, %v", err)
		}
		signal <- struct{}{}
		return
	}

	go func() {
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				err := GetTaskMgr().UpdateTaskInfo(taskID)
				if err != nil {
					logx.Errorf(fmt.Sprintf("UpdateTaskInfo fail, id : %s", taskID), err)
				}
			case <-signal:
				return
			}
		}
	}()
	go func() {
		mgr := task.Client.Manager
		cfg := task.Client.Cfg
		if err = cfg.Build(); err != nil {
			abort()
		}
		if err = mgr.Start(); err != nil {
			abort()
		}
		err = mgr.Wait()
		if err != nil {
			task.TaskInfo.TaskStatus = StatusAborted.String()
			task.TaskInfo.TaskMessage = err.Error()
			err = GetTaskMgr().AbortTask(taskID)
			if err != nil {
				logx.Errorf("finish task fail, %v", err)
			}
			return
		}
		task.TaskInfo.TaskStatus = StatusFinished.String()
		err = GetTaskMgr().FinishTask(taskID)
		if err != nil {
			logx.Errorf("finish task fail, %v", err)
		}
		signal <- struct{}{}
	}()
	return nil
}

func DeleteImportTask(tasksDir, taskID, address, username string) error {
	if id, err := strconv.Atoi(taskID); err != nil {
		logx.Errorf(fmt.Sprintf("stop task fail, id : %s", taskID), err)
		return errors.New("task not existed")
	} else {
		_, err := taskmgr.db.FindTaskInfoByIdAndAddresssAndUser(id, address, username)
		if err != nil {
			logx.Errorf(fmt.Sprintf("stop task fail, id : %s", taskID), err)
			return errors.New("task not existed")
		}
	}
	err := GetTaskMgr().DelTask(tasksDir, taskID)
	if err != nil {
		return fmt.Errorf("task del fail, %s", err.Error())
	}
	return nil
}

func GetImportTask(tasksDir, taskID, address, username string) (*types.GetImportTaskData, error) {
	task := Task{}
	result := &types.GetImportTaskData{}

	if id, err := strconv.Atoi(taskID); err != nil {
		return nil, errors.New("task not existed")
	} else {
		_, err := taskmgr.db.FindTaskInfoByIdAndAddresssAndUser(id, address, username)
		if err != nil {
			return nil, errors.New("task not existed")
		}
	}

	if t, ok := GetTaskMgr().GetTask(taskID); ok {
		task = *t
		importAddress, err := parseImportAddress(task.TaskInfo.ImportAddress)
		if err != nil {
			return nil, err
		}
		stats := task.TaskInfo.Stats
		result.Id = strconv.Itoa(t.TaskInfo.ID)
		result.Status = task.TaskInfo.TaskStatus
		result.Message = task.TaskInfo.TaskMessage
		result.CreateTime = task.TaskInfo.CreateTime.UnixMilli()
		result.UpdateTime = task.TaskInfo.UpdateTime.UnixMilli()
		result.Address = task.TaskInfo.Address
		result.ImportAddress = importAddress
		result.User = task.TaskInfo.User
		result.Name = task.TaskInfo.Name
		result.Space = task.TaskInfo.Space
		result.Stats = types.ImportTaskStats{
			TotalBytes:      stats.TotalBytes,
			ProcessedBytes:  stats.ProcessedBytes,
			FailedRecords:   stats.FailedRecords,
			TotalRecords:    stats.TotalRecords,
			TotalRequest:    stats.TotalRequest,
			FailedRequest:   stats.FailedRequest,
			TotalLatency:    int64(stats.TotalLatency),
			TotalRespTime:   int64(stats.TotalRespTime),
			FailedProcessed: stats.FailedProcessed,
			TotalProcessed:  stats.TotalProcessed,
		}
	}

	return result, nil
}

func GetManyImportTask(tasksDir, address, username string, pageIndex, pageSize int) (*types.GetManyImportTaskData, error) {
	result := &types.GetManyImportTaskData{
		Total: 0,
		List:  []types.GetImportTaskData{},
	}

	tasks, count, err := taskmgr.db.FindTaskInfoByAddressAndUser(address, username, pageIndex, pageSize)
	if err != nil {
		return nil, err
	}

	for _, t := range tasks {
		importAddress, err := parseImportAddress(t.ImportAddress)
		if err != nil {
			return nil, err
		}
		stats := t.Stats
		data := types.GetImportTaskData{
			Id:            strconv.Itoa(t.ID),
			Status:        t.TaskStatus,
			Message:       t.TaskMessage,
			CreateTime:    t.CreateTime.UnixMilli(),
			UpdateTime:    t.UpdateTime.UnixMilli(),
			Address:       t.Address,
			ImportAddress: importAddress,
			User:          t.User,
			Name:          t.Name,
			Space:         t.Space,
			Stats: types.ImportTaskStats{
				TotalBytes:      stats.TotalBytes,
				ProcessedBytes:  stats.ProcessedBytes,
				FailedRecords:   stats.FailedRecords,
				TotalRecords:    stats.TotalRecords,
				TotalRequest:    stats.TotalRequest,
				FailedRequest:   stats.FailedRequest,
				TotalLatency:    int64(stats.TotalLatency),
				TotalRespTime:   int64(stats.TotalRespTime),
				FailedProcessed: stats.FailedProcessed,
				TotalProcessed:  stats.TotalProcessed,
			},
		}
		result.List = append(result.List, data)
	}
	result.Total = count

	return result, nil
}

func StopImportTask(taskID, address, username string) error {
	if id, err := strconv.Atoi(taskID); err != nil {
		logx.Errorf(fmt.Sprintf("stop task fail, id : %s", taskID), err)
		return errors.New("task not existed")
	} else {
		_, err := taskmgr.db.FindTaskInfoByIdAndAddresssAndUser(id, address, username)
		if err != nil {
			logx.Errorf(fmt.Sprintf("stop task fail, id : %s", taskID), err)
			return errors.New("task not existed")
		}
	}

	err := GetTaskMgr().StopTask(taskID)
	if err != nil {
		logx.Errorf(fmt.Sprintf("stop task fail, id : %s", taskID), err)
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	} else {
		return nil
	}
}

func parseImportAddress(address string) ([]string, error) {
	re := regexp.MustCompile(`,\s*`)
	split := re.Split(address, -1)
	importAddress := []string{}

	for i := range split {
		importAddress = append(importAddress, split[i])
	}

	return importAddress, nil
}
