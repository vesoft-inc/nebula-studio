package importer

import (
	"database/sql"
	"fmt"
	"os"
	"strconv"
	"sync"

	"github.com/vesoft-inc/nebula-importer/pkg/cmd"
	"github.com/vesoft-inc/nebula-studio/server/pkg/config"

	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
)

var (
	taskmgr *TaskMgr = &TaskMgr{
		tasks: sync.Map{},
		db:    &sql.DB{},
	}

	tid uint64 = 0

	mux sync.Mutex
)

type TaskMgr struct {
	tasks sync.Map
	db    *sql.DB
}

type Task struct {
	runner *cmd.Runner

	TaskID      string `json:"taskID"`
	TaskStatus  string `json:"taskStatus"`
	TaskMessage string `json:"taskMessage"`
}

func NewTask(taskID string) Task {
	return Task{
		runner:     &cmd.Runner{},
		TaskID:     taskID,
		TaskStatus: StatusProcessing.String(),
	}
}

func (task *Task) GetRunner() *cmd.Runner {
	return task.runner
}

func GetTaskID() (_tid uint64) {
	mux.Lock()
	defer mux.Unlock()
	_tid = tid
	return _tid
}

func NewTaskID() (taskID string) {
	mux.Lock()
	defer mux.Unlock()
	tid++
	taskID = fmt.Sprintf("%d", tid)
	return taskID
}

func GetTaskMgr() *TaskMgr {
	return taskmgr
}

/*
	`GetTask` get task from map and local sql
*/
func (mgr *TaskMgr) GetTask(taskID string) (*Task, bool) {
	_tid, _ := strconv.ParseUint(taskID, 0, 64)

	if _tid > GetTaskID() || tid <= 0 {
		return nil, false
	}

	if task, ok := mgr.getTaskFromMap(taskID); ok {
		return task, true
	}

	return mgr.getTaskFromSQL(taskID), true
}

/*
	`PutTask` put task into tasks map
*/
func (mgr *TaskMgr) PutTask(taskID string, task *Task) {
	mgr.tasks.Store(taskID, task)
}

/*
	`DelTask` will delete task in the map,
	and put the task into local sql
*/
func (mgr *TaskMgr) DelTask(taskID string) {
	task, ok := mgr.getTaskFromMap(taskID)

	if !ok {
		return
	}

	mgr.tasks.Delete(taskID)
	mgr.putTaskIntoSQL(taskID, task)
}

/*
	`StopTask` will change the task status to `StatusStoped`,
	and then call `DelTask`
*/
func (mgr *TaskMgr) StopTask(taskID string) bool {
	if task, ok := mgr.getTaskFromMap(taskID); ok {
		for _, r := range task.GetRunner().Readers {
			r.Stop()
		}

		task.TaskStatus = StatusStoped.String()

		mgr.DelTask(taskID)

		return true
	}

	return false
}

/*
	`GetAllTaskIDs` will return all task ids in map
*/
func (mgr *TaskMgr) GetAllTaskIDs() []string {
	ids := make([]string, 0)
	mgr.tasks.Range(func(k, v interface{}) bool {
		ids = append(ids, k.(string))
		return true
	})

	return ids
}

/*
	`InitDB` initialize local sql by open sql and create tasks table
*/
func InitDB() {
	dbFilePath := config.Cfg.Web.SqlitedbFilePath

	os.Remove(dbFilePath)

	_db, err := sql.Open("sqlite3", dbFilePath)

	if err != nil {
		zap.L().Fatal(err.Error())
	}

	GetTaskMgr().db = _db

	sqlStmt := `
		create table tasks (taskID integer not null primary key, taskStatus text, taskMessage text);
		delete from tasks;
	`
	_, err = GetTaskMgr().db.Exec(sqlStmt)

	if err != nil {
		zap.L().Fatal(fmt.Sprintf("%q: %s\n", err, sqlStmt))
	}

}

func (mgr *TaskMgr) getTaskFromMap(taskID string) (*Task, bool) {
	if task, ok := mgr.tasks.Load(taskID); ok {
		return task.(*Task), true
	}

	return nil, false
}

func (mgr *TaskMgr) getTaskFromSQL(taskID string) *Task {
	var taskStatus string

	rows, _ := mgr.db.Query(fmt.Sprintf("SELECT taskStatus FROM tasks WHERE taskID=%s", taskID))

	for rows.Next() {
		_ = rows.Scan(&taskStatus)
	}

	return &Task{
		TaskID:     taskID,
		TaskStatus: taskStatus,
	}
}

func (mgr *TaskMgr) putTaskIntoSQL(taskID string, task *Task) {
	stmt, _ := mgr.db.Prepare("INSERT INTO tasks(taskID, taskStatus) values(?,?)")

	_, _ = stmt.Exec(taskID, task.TaskStatus)
}

type TaskAction int

const (
	ActionUnknown TaskAction = iota
	ActionQuery
	ActionQueryAll
	ActionStop
	ActionStopAll
)

var taskActionMap = map[TaskAction]string{
	ActionQuery:    "actionQuery",
	ActionQueryAll: "actionQueryAll",
	ActionStop:     "actionStop",
	ActionStopAll:  "actionStopAll",
}

var taskActionRevMap = map[string]TaskAction{
	"actionQuery":    ActionQuery,
	"actionQueryAll": ActionQueryAll,
	"actionStop":     ActionStop,
	"actionStopAll":  ActionStopAll,
}

func NewTaskAction(action string) TaskAction {
	if v, ok := taskActionRevMap[action]; ok {
		return v
	}
	return ActionUnknown
}

func (action TaskAction) String() string {
	if v, ok := taskActionMap[action]; ok {
		return v
	}
	return "actionUnknown"
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
	StatusFinished:   "statusFinished",
	StatusStoped:     "statusStoped",
	StatusProcessing: "statusProcessing",
	StatusNotExisted: "statusNotExisted",
	StatusAborted:    "statusAborted",
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
