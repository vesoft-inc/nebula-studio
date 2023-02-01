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
func (t *TaskDb) FindTaskInfoByIdAndAddresssAndUser(id int, address, user string) (*db.TaskInfo, error) {
	taskInfo := new(db.TaskInfo)
	if err := t.Model(&db.TaskInfo{}).Where("id = ? AND address = ? And user = ?", id, address,
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
	return t.Model(&db.TaskInfo{}).Where("id = ?", info.ID).Updates(info).Error
}

func (t *TaskDb) DelTaskInfo(ID int) error {
	return t.Delete(&db.TaskInfo{}, ID).Error
}

func (t *TaskDb) LastId() (int, error) {
	var id int
	if err := t.Raw("SELECT MAX(id) FROM task_infos").Scan(&id).Error; err != nil {
		if err.Error() == "sql: Scan error on column index 0, name \"MAX(id)\": converting NULL to int is unsupported" {
			return 0, nil
		}
		return 0, err
	}
	return id, nil
}

func (t *TaskDb) SelectAllIds(address, user string) ([]int, error) {
	var taskInfos []db.TaskInfo
	ids := make([]int, 0)
	if err := t.Select("id").Where("address = ? And user = ?", address, user).Order("created_time desc").Find(&taskInfos).Error; err != nil {
		return nil, err
	}
	for _, taskInfo := range taskInfos {
		ids = append(ids, taskInfo.ID)
	}
	return ids, nil
}

func (t *TaskDb) UpdateProcessingTasks2Aborted() error {
	if err := t.Model(&db.TaskInfo{}).Where("task_status = ?", StatusProcessing.String()).Updates(&db.TaskInfo{TaskStatus: StatusAborted.String(), TaskMessage: "Service execption"}).Error; err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return nil
}
