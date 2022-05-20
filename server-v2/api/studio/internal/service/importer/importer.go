package importer

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	importconfig "github.com/vesoft-inc/nebula-importer/pkg/config"
	importerErrors "github.com/vesoft-inc/nebula-importer/pkg/errors"
	"github.com/vesoft-inc/nebula-importer/pkg/logger"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server-v2/api/studio/pkg/utils"
	"go.uber.org/zap"

	"gopkg.in/yaml.v2"
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

func GetNewTaskDir(tasksDir string) (string, error) {
	taskId, err := GetTaskMgr().NewTaskID()
	if err != nil {
		return "", err
	}
	taskDir := filepath.Join(tasksDir, taskId)
	return taskDir, nil
}

func CreateConfigFile(uploadDir, taskdir string, config importconfig.YAMLConfig) error {
	fileName := "config.yaml"
	// err := utils.CreateDir(taskdir)
	if err := utils.CreateDir(taskdir); err != nil {
		return err
	}
	path := filepath.Join(taskdir, fileName)
	// erase user information
	address := *config.NebulaClientSettings.Connection.Address
	user := *config.NebulaClientSettings.Connection.User
	password := *config.NebulaClientSettings.Connection.Password
	*config.NebulaClientSettings.Connection.Address = ""
	*config.NebulaClientSettings.Connection.User = ""
	*config.NebulaClientSettings.Connection.Password = ""

	// erase path infomation
	logPath := *config.LogPath
	*config.LogPath = "import.log"
	paths := make([]string, 0)
	failDataPaths := make([]string, 0)
	for _, file := range config.Files {
		paths = append(paths, filepath.Join(uploadDir, *file.Path))
		failDataPaths = append(failDataPaths, filepath.Join(taskdir, "err", *file.FailDataPath))
		_, fileName := filepath.Split(*file.Path)
		_, fileDataName := filepath.Split(*file.FailDataPath)
		*file.Path = fileName
		*file.FailDataPath = fileDataName
	}

	outYaml, err := yaml.Marshal(config)
	if err != nil {
		return err
	}
	if err := os.WriteFile(path, outYaml, 0o644); err != nil {
		zap.L().Warn("write"+path+"file error", zap.Error(err))
		return err
	}

	*config.LogPath = logPath
	*config.NebulaClientSettings.Connection.Address = address
	*config.NebulaClientSettings.Connection.User = user
	*config.NebulaClientSettings.Connection.Password = password
	for i, file := range config.Files {
		*file.Path = paths[i]
		*file.FailDataPath = failDataPaths[i]
	}
	return nil
}

func Import(taskID string, conf *importconfig.YAMLConfig) (err error) {
	runnerLogger := logger.NewRunnerLogger(*conf.LogPath)
	if err := conf.ValidateAndReset("", runnerLogger); err != nil {
		return err
	}

	task, _ := GetTaskMgr().GetTask(taskID)
	go func() {
		result := ImportResult{}
		now := time.Now()
		task.GetRunner().Run(conf)
		timeCost := time.Since(now).Milliseconds()
		result.TaskId = taskID
		result.TimeCost = fmt.Sprintf("%dms", timeCost)
		if rerrs := task.GetRunner().Errors(); len(rerrs) != 0 {
			allErrIsNotCompleteError := true
			for _, rerr := range rerrs {
				err := rerr.(importerErrors.ImporterError)
				if err.ErrCode != importerErrors.NotCompleteError {
					allErrIsNotCompleteError = false
					break
				}
			}
			if allErrIsNotCompleteError {
				task.TaskInfo.TaskStatus = StatusFinished.String()
				result.FailedRows = task.GetRunner().NumFailed
				err1 := GetTaskMgr().FinishTask(taskID)
				if err1 != nil {
					zap.L().Warn("finish task fail", zap.Error(err1))
				}
				zap.L().Debug(fmt.Sprintf("Success to finish a import task: `%s`, task result: `%v`", taskID, result))
				return
			}
			// TODO: return all errors
			task.TaskInfo.TaskStatus = StatusAborted.String()
			err, _ := rerrs[0].(importerErrors.ImporterError)
			result.ErrorResult.ErrorCode = err.ErrCode
			result.ErrorResult.ErrorMsg = err.ErrMsg.Error()
			task.TaskInfo.TaskMessage = err.ErrMsg.Error()
			err1 := GetTaskMgr().AbortTask(taskID)
			if err1 != nil {
				zap.L().Warn("finish task fail", zap.Error(err1))
			}
			zap.L().Warn(fmt.Sprintf("Failed to finish a import task: `%s`, task result: `%v`", taskID, result))
		} else {
			task.TaskInfo.TaskStatus = StatusFinished.String()
			result.FailedRows = task.GetRunner().NumFailed
			err := GetTaskMgr().FinishTask(taskID)
			if err != nil {
				zap.L().Warn("finish task fail", zap.Error(err))
			}
			zap.L().Debug(fmt.Sprintf("Success to finish a import task: `%s`, task result: `%v`", taskID, result))
		}
	}()
	return nil
}

func ImportStatus(taskID string) (*TaskInfo, error) {
	if t, ok := GetTaskMgr().GetTask(taskID); ok {
		if t.GetRunner() != nil {
			err := GetTaskMgr().UpdateTaskInfo(taskID)
			if err != nil {
				return nil, err
			}
		}
		return t.TaskInfo, nil
	}
	return nil, errors.New("task is not exist")
}

func DeleteImportTask(tasksDir, taskID, address, username string) error {
	if id, err := strconv.Atoi(taskID); err != nil {
		zap.L().Warn(fmt.Sprintf("stop task fail, id : %s", taskID), zap.Error(err))
		return errors.New("task not existed")
	} else {
		_, err := taskmgr.db.FindTaskInfoByIdAndAddresssAndUser(id, address, username)
		if err != nil {
			zap.L().Warn(fmt.Sprintf("stop task fail, id : %s", taskID), zap.Error(err))
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
		zap.L().Warn(fmt.Sprintf("UpdateTaskInfo fail, id : %s", taskID), zap.Error(err))
		return nil, errors.New("task not existed")
	} else {
		_, err := taskmgr.db.FindTaskInfoByIdAndAddresssAndUser(id, address, username)
		if err != nil {
			zap.L().Warn(fmt.Sprintf("UpdateTaskInfo fail, id : %s", taskID), zap.Error(err))
			return nil, errors.New("task not existed")
		}
	}

	err := GetTaskMgr().UpdateTaskInfo(taskID)
	if err != nil {
		zap.L().Warn(fmt.Sprintf("UpdateTaskInfo fail, id : %s", taskID), zap.Error(err))
	}
	if t, ok := GetTaskMgr().GetTask(taskID); ok {
		task = *t
		result.Id = fmt.Sprintf("%d", task.TaskInfo.ID)
		result.Status = task.TaskInfo.TaskStatus
		result.CreateTime = task.TaskInfo.CreatedTime
		result.UpdateTime = task.TaskInfo.UpdatedTime
		result.Address = task.TaskInfo.NebulaAddress
		result.User = task.TaskInfo.User
		result.Name = task.TaskInfo.Name
		result.Space = task.TaskInfo.Space
		result.Stats = types.ImportTaskStats(task.TaskInfo.Stats)
	}

	return result, nil
}

func GetManyImportTask(tasksDir, address, username string, page, pageSize int) (*types.GetManyImportTaskData, error) {
	result := &types.GetManyImportTaskData{
		Total: 0,
		List:  []types.GetImportTaskData{},
	}

	taskIDs, err := GetTaskMgr().GetAllTaskIDs(address, username)
	if err != nil {
		return nil, err
	}

	start := (page - 1) * pageSize
	stop := page * pageSize
	if len(taskIDs) <= start {
		return nil, errors.New("invalid parameter")
	} else {
		if stop >= len(taskIDs) {
			stop = len(taskIDs)
		}
		result.Total = int64(stop - start)

		for i := start; i < stop; i++ {
			data, _ := GetImportTask(tasksDir, taskIDs[i], address, username)
			result.List = append(result.List, *data)
		}
	}

	return result, nil
}

func StopImportTask(taskID, address, username string) error {
	if id, err := strconv.Atoi(taskID); err != nil {
		zap.L().Warn(fmt.Sprintf("stop task fail, id : %s", taskID), zap.Error(err))
		return errors.New("task not existed")
	} else {
		_, err := taskmgr.db.FindTaskInfoByIdAndAddresssAndUser(id, address, username)
		if err != nil {
			zap.L().Warn(fmt.Sprintf("stop task fail, id : %s", taskID), zap.Error(err))
			return errors.New("task not existed")
		}
	}

	err := GetTaskMgr().StopTask(taskID)
	if err != nil {
		zap.L().Warn(fmt.Sprintf("stop task fail, id : %s", taskID), zap.Error(err))
		return err
	} else {
		return nil
	}
}
