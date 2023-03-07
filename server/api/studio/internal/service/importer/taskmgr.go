package importer

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"sync"

	importConfig "github.com/vesoft-inc/nebula-importer/v4/pkg/config"
	configv3 "github.com/vesoft-inc/nebula-importer/v4/pkg/config/v3"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/core/logx"
	"go.uber.org/zap"
	"gopkg.in/yaml.v2"

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

func createTaskClient(conf configv3.Config) (client Client, err error) {
	jsons, err := json.Marshal(conf)
	if err != nil {
		return Client{}, ecode.WithErrorMessage(ecode.ErrParam, err)
	}
	cfg, err := importConfig.FromBytes(jsons)
	if err != nil {
		return Client{}, ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	client = Client{
		Cfg:     cfg,
		Manager: cfg.GetManager(),
		Logger:  cfg.GetLogger(),
	}
	return client, nil
}

func CreateTaskDir(rootDir string, id string) (string, error) {
	taskDir := filepath.Join(rootDir, id)
	if err := utils.CreateDir(taskDir); err != nil {
		return "", ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return taskDir, nil
}

func CreateConfigFile(taskdir string, config configv3.Config) error {
	fileName := "config.yaml"
	path := filepath.Join(taskdir, fileName)
	// erase user information
	_config := config
	_config.Client.User = ""
	_config.Client.Password = ""
	_config.Client.Address = ""

	// TODO hide data source access key and so on

	outYaml, err := yaml.Marshal(config)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	if err := os.WriteFile(path, outYaml, 0o644); err != nil {
		zap.L().Warn("write"+path+"file error", zap.Error(err))
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return nil
}

func (mgr *TaskMgr) NewTask(host string, user string, taskName string, conf configv3.Config) (*Task, string, error) {
	mux.Lock()
	defer mux.Unlock()
	// init importer client
	client, err := createTaskClient(conf)
	if err != nil {
		return nil, "", err
	}
	// init task db
	taskInfo := &db.TaskInfo{
		Name:          taskName,
		Address:       host,
		Space:         conf.Manager.GraphName,
		TaskStatus:    StatusProcessing.String(),
		ImportAddress: conf.Client.Address,
		User:          user,
	}
	task := &Task{
		Client:   client,
		TaskInfo: taskInfo,
	}
	if err := mgr.db.InsertTaskInfo(task.TaskInfo); err != nil {
		return nil, "", err
	}

	// create task dir
	id := string(taskInfo.ID)
	mgr.PutTask(id, task)
	return task, id, nil
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
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	err = mgr.db.UpdateTaskInfo(task.TaskInfo)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	mgr.tasks.Delete(taskID)
	return
}

func (mgr *TaskMgr) AbortTask(taskID string) (err error) {
	task, ok := mgr.getTaskFromMap(taskID)
	if !ok {
		return
	}
	err = mgr.db.UpdateTaskInfo(task.TaskInfo)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
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
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
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
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return mgr.db.UpdateTaskInfo(task.TaskInfo)
}

/*
StopTask will change the task status to `StatusStoped`,
and then call FinishTask
*/
func (mgr *TaskMgr) StopTask(taskID string) error {
	if task, ok := mgr.getTaskFromMap(taskID); ok {
		manager := task.Client.Manager
		err := manager.Stop()
		if err != nil {
			return errors.New("stop task fail")
		}
		task.TaskInfo.TaskStatus = StatusStoped.String()
		if err := mgr.FinishTask(taskID); err != nil {
			logx.Alert(fmt.Sprintf("finish task fail: %s", err))
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
		}
		return nil
	}
	return errors.New("task is finished or not exist")
}

/*
`GetAllTaskIDs` will return all task ids in map
*/
func (mgr *TaskMgr) GetAllTaskIDs(address, username string) ([]string, error) {
	ids := make([]string, 0)
	allIds, err := mgr.db.SelectAllIds(address, username)
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
