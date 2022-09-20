package importer

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"

	"github.com/vesoft-inc/nebula-importer/pkg/cmd"
	"github.com/zeromicro/go-zero/core/logx"

	_ "github.com/mattn/go-sqlite3"
)

var (
	taskmgr *TaskMgr = &TaskMgr{
		tasks: sync.Map{},
		db:    &TaskDb{},
	}

	mux sync.Mutex
)

type TaskMgr struct {
	tasks sync.Map
	db    *TaskDb
}

func newTask(nebulaAddress string, user string, name string, space string) *Task {
	timeUnix := time.Now().Unix()
	return &Task{
		Runner: &cmd.Runner{},
		TaskInfo: &db.TaskInfo{
			Name:          name,
			Space:         space,
			CreatedTime:   timeUnix,
			UpdatedTime:   timeUnix,
			TaskStatus:    StatusProcessing.String(),
			NebulaAddress: nebulaAddress,
			User:          user,
		},
	}
}

func (task *Task) GetRunner() *cmd.Runner {
	return task.Runner
}

func (mgr *TaskMgr) NewTaskID() (string, error) {
	tid, err := mgr.db.LastId()
	if err != nil {
		return "", err
	}
	taskID := fmt.Sprintf("%v", tid+1)
	return taskID, nil
}

func (mgr *TaskMgr) NewTask(nebulaAddress string, user string, name string, space string) (*Task, string, error) {
	mux.Lock()
	defer mux.Unlock()
	task := newTask(nebulaAddress, user, name, space)
	if err := mgr.db.InsertTaskInfo(task.TaskInfo); err != nil {
		return nil, "", err
	}
	tid, err := mgr.db.LastId()
	if err != nil {
		return nil, "", err
	}
	task.TaskInfo.ID = tid
	taskID := fmt.Sprintf("%v", tid)
	mgr.PutTask(taskID, task)
	return task, taskID, nil
}

func GetTaskMgr() *TaskMgr {
	return taskmgr
}

/*
	GetTask get task from map and local sql
*/
func (mgr *TaskMgr) GetTask(taskID string) (*Task, bool) {
	if task, ok := mgr.getTaskFromMap(taskID); ok {
		return task, true
	}
	task := mgr.getTaskFromSQL(taskID)
	// did not find task
	if task.TaskInfo.ID == 0 {
		return nil, false
	}
	return task, true
}

/*
	PutTask put task into tasks map
*/
func (mgr *TaskMgr) PutTask(taskID string, task *Task) {
	mgr.tasks.Store(taskID, task)
}

/*
	FinishTask will query task stats, delete task in the map
	and update the taskInfo in local sql
*/
func (mgr *TaskMgr) FinishTask(taskID string) (err error) {
	task, ok := mgr.getTaskFromMap(taskID)
	if !ok {
		return
	}
	if err := task.UpdateQueryStats(); err != nil {
		return err
	}
	timeUnix := time.Now().Unix()
	task.TaskInfo.UpdatedTime = timeUnix
	err = mgr.db.UpdateTaskInfo(task.TaskInfo)
	if err != nil {
		return err
	}
	mgr.tasks.Delete(taskID)
	return
}

func (mgr *TaskMgr) AbortTask(taskID string) (err error) {
	task, ok := mgr.getTaskFromMap(taskID)
	if !ok {
		return
	}
	timeUnix := time.Now().Unix()
	task.TaskInfo.UpdatedTime = timeUnix
	err = mgr.db.UpdateTaskInfo(task.TaskInfo)
	if err != nil {
		return err
	}
	mgr.tasks.Delete(taskID)
	return
}

func (mgr *TaskMgr) DelTask(tasksDir, taskID string) error {
	_, ok := mgr.getTaskFromMap(taskID)
	if ok {
		mgr.tasks.Delete(taskID)
	}
	id, err := strconv.Atoi(taskID)
	if err != nil {
		return errors.New("taskID is wrong")
	}
	if err = mgr.db.DelTaskInfo(id); err != nil {
		return err
	}
	taskDir := filepath.Join(tasksDir, taskID)
	return os.RemoveAll(taskDir)
}

/*
	UpdateTaskInfo will query task stats, update task in the map
	and update the taskInfo in local sql
*/
func (mgr *TaskMgr) UpdateTaskInfo(taskID string) error {
	task, ok := mgr.getTaskFromMap(taskID)
	if !ok {
		return nil
	}
	if err := task.UpdateQueryStats(); err != nil {
		return err
	}
	timeUnix := time.Now().Unix()
	task.TaskInfo.UpdatedTime = timeUnix
	return mgr.db.UpdateTaskInfo(task.TaskInfo)
}

/*
	StopTask will change the task status to `StatusStoped`,
	and then call FinishTask
*/
func (mgr *TaskMgr) StopTask(taskID string) error {
	if task, ok := mgr.getTaskFromMap(taskID); ok {
		if task.GetRunner().Readers == nil {
			return errors.New("task is not initialized")
		}
		for _, r := range task.GetRunner().Readers {
			r.Stop()
		}
		task.TaskInfo.TaskStatus = StatusStoped.String()
		if err := mgr.FinishTask(taskID); err != nil {
			logx.Alert(fmt.Sprintf("finish task fail: %s", err))
			return err
		}
		return nil
	}
	return errors.New("task is finished or not exist")
}

/*
	`GetAllTaskIDs` will return all task ids in map
*/
func (mgr *TaskMgr) GetAllTaskIDs(nebulaAddress, username string) ([]string, error) {
	ids := make([]string, 0)
	allIds, err := mgr.db.SelectAllIds(nebulaAddress, username)
	if err != nil {
		return nil, err
	}
	for _, id := range allIds {
		ids = append(ids, strconv.Itoa(id))
	}
	return ids, nil
}

func (mgr *TaskMgr) getTaskFromMap(taskID string) (*Task, bool) {
	if task, ok := mgr.tasks.Load(taskID); ok {
		return task.(*Task), true
	}
	return nil, false
}

func (mgr *TaskMgr) getTaskFromSQL(taskID string) *Task {
	taskInfo := new(db.TaskInfo)
	mgr.db.First(taskInfo, taskID)
	task := new(Task)
	task.TaskInfo = taskInfo
	return task
}

type TaskStatus int

/*
	the task in memory (map) has 2 status: processing, aborted;
	and the task in local sql has 2 status: finished, stoped;
*/
const (
	StatusUnknown TaskStatus = iota
	StatusFinished
	StatusStoped
	StatusProcessing
	StatusNotExisted
	StatusAborted
)

var taskStatusMap = map[TaskStatus]string{
	StatusFinished:   "Success",
	StatusStoped:     "Stopped",
	StatusProcessing: "Running",
	StatusNotExisted: "NotExisted",
	StatusAborted:    "Failed",
}

var taskStatusRevMap = map[string]TaskStatus{
	"statusFinished":   StatusFinished,
	"statusStoped":     StatusStoped,
	"statusProcessing": StatusProcessing,
	"statusNotExisted": StatusNotExisted,
	"statusAborted":    StatusAborted,
}

func NewTaskStatus(status string) TaskStatus {
	if v, ok := taskStatusRevMap[status]; ok {
		return v
	}
	return StatusUnknown
}

func (status TaskStatus) String() string {
	if v, ok := taskStatusMap[status]; ok {
		return v
	}
	return "statusUnknown"
}
