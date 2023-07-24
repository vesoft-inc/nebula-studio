package importer

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	importconfig "github.com/vesoft-inc/nebula-importer/v4/pkg/config"
	configv3 "github.com/vesoft-inc/nebula-importer/v4/pkg/config/v3"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"gopkg.in/yaml.v3"

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

func CreateNewTaskDir(rootDir string, id string) (string, error) {
	taskDir := filepath.Join(rootDir, id)
	if err := utils.CreateDir(taskDir); err != nil {
		return "", ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return taskDir, nil
}

func CreateConfigFile(taskdir string, cfgBytes []byte) error {
	fileName := "config.yaml"
	path := filepath.Join(taskdir, fileName)
	config, _ := importconfig.FromBytes(cfgBytes)
	confv3 := config.(*configv3.Config)

	// erase user information
	_config := confv3
	_config.Client.User = "${YOUR_NEBULA_NAME}"
	_config.Client.Password = "${YOUR_NEBULA_PASSWORD}"
	_config.Client.Address = "${YOUR_NEBULA_ADDRESS}"
	for _, source := range _config.Sources {
		S3Config := source.SourceConfig.S3
		SFTPConfig := source.SourceConfig.SFTP
		OSSConfig := source.SourceConfig.OSS
		if S3Config != nil {
			S3Config.AccessKeyID = "${YOUR_S3_ACCESS_KEY}"
			S3Config.AccessKeySecret = "${YOUR_S3_SECRET_KEY}"
		}
		if SFTPConfig != nil {
			SFTPConfig.User = "${YOUR_SFTP_USER}"
			SFTPConfig.Password = "${YOUR_SFTP_PASSWORD}"
		}
		if OSSConfig != nil {
			OSSConfig.AccessKeyID = "${YOUR_OSS_ACCESS_KEY}"
			OSSConfig.AccessKeySecret = "${YOUR_OSS_SECRET_KEY}"
		}
	}
	outYaml, err := yaml.Marshal(confv3)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	if err := os.WriteFile(path, outYaml, 0o644); err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return nil
}

func (mgr *TaskMgr) NewTask(id, host, user, taskName, rawCfg string, cfg importconfig.Configurator) (*Task, error) {
	mux.Lock()
	defer mux.Unlock()
	confv3 := cfg.(*configv3.Config)

	// init task db
	taskInfo := &db.TaskInfo{
		BID:           id,
		Name:          taskName,
		Address:       host,
		Space:         confv3.Manager.GraphName,
		TaskStatus:    Processing.String(),
		ImportAddress: confv3.Client.Address,
		User:          user,
		RawConfig:     rawCfg,
	}

	if err := mgr.db.InsertTaskInfo(taskInfo); err != nil {
		return nil, err
	}

	task := &Task{
		Client: &Client{
			Cfg:        cfg,
			Manager:    nil,
			Logger:     nil,
			HasStarted: false,
		},
		TaskInfo: taskInfo,
	}

	mgr.PutTask(id, task)
	return task, nil
}

func (mgr *TaskMgr) TurnDraftToTask(id, taskName, rawCfg string, cfg importconfig.Configurator) (*Task, error) {
	mux.Lock()
	defer mux.Unlock()
	confv3 := cfg.(*configv3.Config)

	// init task db
	taskInfo := &db.TaskInfo{
		BID:           id,
		Name:          taskName,
		Space:         confv3.Manager.GraphName,
		TaskStatus:    Processing.String(),
		ImportAddress: confv3.Client.Address,
		RawConfig:     rawCfg,
		CreateTime:    time.Now(),
	}

	if err := mgr.db.UpdateTaskInfo(taskInfo); err != nil {
		return nil, err
	}

	task := &Task{
		Client: &Client{
			Cfg:        cfg,
			Manager:    nil,
			Logger:     nil,
			HasStarted: false,
		},
		TaskInfo: taskInfo,
	}

	mgr.PutTask(id, task)
	return task, nil
}

func (mgr *TaskMgr) NewTaskDraft(id, host, user, taskName, space, rawCfg string) error {
	mux.Lock()
	defer mux.Unlock()
	// init task db
	taskInfo := &db.TaskInfo{
		BID:           id,
		Name:          taskName,
		Address:       host,
		Space:         space,
		TaskStatus:    Draft.String(),
		ImportAddress: "",
		User:          user,
		RawConfig:     rawCfg,
	}
	if err := mgr.db.InsertTaskInfo(taskInfo); err != nil {
		return err
	}
	return nil
}

func (mgr *TaskMgr) UpdateTaskDraft(id, taskName, space, rawCfg string) error {
	mux.Lock()
	defer mux.Unlock()
	// init task db
	taskInfo := &db.TaskInfo{
		BID:        id,
		Name:       taskName,
		Space:      space,
		TaskStatus: Draft.String(),
		RawConfig:  rawCfg,
	}
	if err := mgr.db.UpdateTaskInfo(taskInfo); err != nil {
		return err
	}
	return nil
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
	if err := mgr.db.DelTaskInfo(taskID); err != nil {
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
StopTask will change the task status to `Stoped`,
and then call FinishTask
*/
func (mgr *TaskMgr) StopTask(taskID string) error {
	if task, ok := mgr.getTaskFromMap(taskID); ok {
		var err error
		manager := task.Client.Manager
		if manager != nil {
			if task.Client.HasStarted {
				err = manager.Stop()
			} else {
				// hack import not support stop before start()
				err = errors.New("task has not started, please try later")
			}
		} else {
			err = errors.New("manager is nil, please try later")
		}

		if err != nil {
			return fmt.Errorf("stop task failed: %w", err)
		}
		task.TaskInfo.TaskStatus = Stoped.String()
		if err := mgr.FinishTask(taskID); err != nil {
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
		}
		return nil
	}
	return errors.New("task is finished or not exist")
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
	Finished
	Stoped
	Processing
	NotExisted
	Aborted
	Draft
)

var taskStatusMap = map[TaskStatus]string{
	Finished:   "Success",
	Stoped:     "Stopped",
	Processing: "Running",
	NotExisted: "NotExisted",
	Aborted:    "Failed",
	Draft:      "Draft",
}

var taskStatusRevMap = map[string]TaskStatus{
	"finished":   Finished,
	"stoped":     Stoped,
	"processing": Processing,
	"notExisted": NotExisted,
	"aborted":    Aborted,
	"draft":      Draft,
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
