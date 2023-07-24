package importer

import (
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"

	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
)

type TaskDb struct {
	*gorm.DB
}

func InitTaskStatus() {
	GetTaskMgr().db = &TaskDb{
		DB: db.CtxDB,
	}
	if err := GetTaskMgr().db.UpdateProcessingTasks2Aborted(); err != nil {
		logx.Errorf("update processing tasks to aborted failed: %s", err)
		panic(err)
	}
}

// FindTaskInfoByIdAndAddresssAndUser used to check whether the task belongs to the user
func (t *TaskDb) FindTaskInfoByIdAndAddresssAndUser(id, address, user string) (*db.TaskInfo, error) {
	taskInfo := new(db.TaskInfo)
	if err := t.Model(&db.TaskInfo{}).Where("b_id = ? AND address = ? And user = ?", id, address,
		user).First(&taskInfo).Error; err != nil {
		return nil, err
	}
	return taskInfo, nil
}

func (t *TaskDb) FindTaskInfoByAddressAndUser(address, user string, pageIndex, pageSize int) ([]*db.TaskInfo, int64, error) {
	tasks := make([]*db.TaskInfo, 0)
	var count int64
	tx := t.Model(&db.TaskInfo{}).Where("address = ? And user = ?", address, user).Order("id desc")
	if err := tx.Count(&count).Error; err != nil {
		return nil, 0, err
	}
	if err := tx.Offset((pageIndex - 1) * pageSize).Limit(pageSize).Find(&tasks).Error; err != nil {
		return nil, count, err
	}
	return tasks, count, nil
}

func (t *TaskDb) InsertTaskInfo(info *db.TaskInfo) error {
	return t.Create(info).Error
}

func (t *TaskDb) UpdateTaskInfo(info *db.TaskInfo) error {
	return t.Model(&db.TaskInfo{}).Where("b_id = ?", info.BID).Updates(info).Error
}

func (t *TaskDb) DelTaskInfo(ID string) error {
	return t.Delete(&db.TaskInfo{
		BID: ID,
	}).Error
}

func (t *TaskDb) UpdateProcessingTasks2Aborted() error {
	if err := t.Model(&db.TaskInfo{}).Where("task_status = ?", Processing.String()).Updates(&db.TaskInfo{TaskStatus: Aborted.String(), TaskMessage: "Service execption"}).Error; err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return nil
}
