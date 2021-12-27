package importer

import (
	"errors"
	"fmt"
	"time"

	importconfig "github.com/vesoft-inc/nebula-importer/pkg/config"
	importerErrors "github.com/vesoft-inc/nebula-importer/pkg/errors"

	"go.uber.org/zap"
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

type ActionResult struct {
	Results []Task `json:"results"`
	Msg     string `json:"msg"`
}

func Import(taskID string, configPath string, configBody *importconfig.YAMLConfig) (err error) {
	zap.L().Debug(fmt.Sprintf("Start a import task: `%s`", taskID))

	var conf *importconfig.YAMLConfig

	if configPath != "" {
		conf, err = importconfig.Parse(
			configPath,
		)

		if err != nil {
			return err.(importerErrors.ImporterError)
		}
	} else {
		conf = configBody
	}

	if err := conf.ValidateAndReset(""); err != nil {
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

		if rerr := task.GetRunner().Error(); rerr != nil {
			// task err: import task not finished err handle
			task.TaskStatus = StatusAborted.String()

			err, _ := rerr.(importerErrors.ImporterError)
			result.ErrorResult.ErrorCode = err.ErrCode
			result.ErrorResult.ErrorMsg = err.ErrMsg.Error()
			task.TaskMessage = err.ErrMsg.Error()
			zap.L().Warn(fmt.Sprintf("Failed to finish a import task: `%s`, task result: `%v`", taskID, result))
		} else {
			task.TaskStatus = StatusFinished.String()

			result.FailedRows = task.GetRunner().NumFailed
			GetTaskMgr().DelTask(taskID)
			zap.L().Debug(fmt.Sprintf("Success to finish a import task: `%s`, task result: `%v`", taskID, result))
		}
	}()
	return nil
}

func ImportAction(taskID string, taskAction TaskAction) (result ActionResult, err error) {
	zap.L().Debug(fmt.Sprintf("Start a import task action: `%s` for task: `%s`", taskAction.String(), taskID))

	result = ActionResult{}

	switch taskAction {
	case ActionQuery:
		actionQuery(taskID, &result)
	case ActionQueryAll:
		actionQueryAll(&result)
	case ActionStop:
		actionStop(taskID, &result)
	case ActionStopAll:
		actionStopAll(&result)
	default:
		err = errors.New("unknown task action")
	}

	zap.L().Debug(fmt.Sprintf("The import task action: `%s` for task: `%s` finished, action result: `%v`", taskAction.String(), taskID, result))

	return result, err
}

func actionQuery(taskID string, result *ActionResult) {
	// a temp task obj for response
	task := Task{}
	if t, ok := GetTaskMgr().GetTask(taskID); ok {
		task.TaskID = t.TaskID
		task.TaskStatus = t.TaskStatus
		task.TaskMessage = t.TaskMessage
		result.Results = append(result.Results, task)
		result.Msg = "Task query successfully"
	} else {
		task.TaskID = taskID
		task.TaskStatus = StatusNotExisted.String()
		result.Results = append(result.Results, task)
		result.Msg = "Task not existed"
	}
}

/*
	`actionQueryAll` will return all tasks with status Aborted or Processing
*/
func actionQueryAll(result *ActionResult) {
	taskIDs := GetTaskMgr().GetAllTaskIDs()
	for _, taskID := range taskIDs {
		actionQuery(taskID, result)
	}

	result.Msg = "Tasks query successfully"
}

func actionStop(taskID string, result *ActionResult) {
	ok := GetTaskMgr().StopTask(taskID)

	actionQuery(taskID, result)

	if !ok {
		result.Msg = "Task has stopped or finished"
	}

	result.Msg = "Task stop successfully"
}

/*
	`actionStopAll` will stop all tasks with status Processing
*/
func actionStopAll(result *ActionResult) {
	taskIDs := GetTaskMgr().GetAllTaskIDs()
	for _, taskID := range taskIDs {
		if _task, _ := GetTaskMgr().GetTask(taskID); _task.TaskStatus == StatusProcessing.String() {
			actionStop(taskID, result)
		}
	}

	result.Msg = "Tasks stop successfully"
}
