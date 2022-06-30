package importer

import (
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type TaskDb struct {
	*gorm.DB
}

func InitDB(sqlitedbFilePath string) {
	dbFilePath := sqlitedbFilePath
	db, err := gorm.Open(sqlite.Open(dbFilePath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		logx.Errorf("init db fail: %s", err)
	}

	err = db.AutoMigrate(&TaskInfo{})
	if err != nil {
		logx.Errorf("init taskInfo table fail: %s", err)
		panic(err)
	}
	GetTaskMgr().db = &TaskDb{
		DB: db,
	}
	if err := GetTaskMgr().db.UpdateProcessingTasks2Aborted(); err != nil {
		logx.Errorf("update processing tasks to aborted failed: %s", err)
		panic(err)
	}
}

// FindTaskInfoByIdAndAddresssAndUser used to check whether the task belongs to the user
func (t *TaskDb) FindTaskInfoByIdAndAddresssAndUser(id int, nebulaAddress, user string) (*TaskInfo, error) {
	taskInfo := new(TaskInfo)
	if err := t.Model(&TaskInfo{}).Where("id = ? AND nebula_address = ? And user = ?", id, nebulaAddress,
		user).First(&taskInfo).Error; err != nil {
		return nil, err
	}
	return taskInfo, nil
}

func (t *TaskDb) FindTaskInfoByAddressAndUser(nebulaAddress, user string, pageIndex, pageSize int) ([]*TaskInfo, int64, error) {
	tasks := make([]*TaskInfo, 0)
	var count int64
	tx := t.Model(&TaskInfo{}).Where("nebula_address = ? And user = ?", nebulaAddress, user).Order("id desc")
	if err := tx.Count(&count).Error; err != nil {
		return nil, 0, err
	}
	if err := tx.Offset((pageIndex - 1) * pageSize).Limit(pageSize).Find(&tasks).Error; err != nil {
		return nil, count, err
	}
	return tasks, count, nil
}

func (t *TaskDb) InsertTaskInfo(info *TaskInfo) error {
	return t.Create(info).Error
}

func (t *TaskDb) UpdateTaskInfo(info *TaskInfo) error {
	return t.Model(&TaskInfo{}).Where("id = ?", info.ID).Updates(info).Error
}

func (t *TaskDb) DelTaskInfo(ID int) error {
	return t.Delete(&TaskInfo{}, ID).Error
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

func (t *TaskDb) SelectAllIds(nebulaAddress, user string) ([]int, error) {
	var taskInfos []TaskInfo
	ids := make([]int, 0)
	if err := t.Select("id").Where("nebula_address = ? And user = ?", nebulaAddress, user).Order("created_time desc").Find(&taskInfos).Error; err != nil {
		return nil, err
	}
	for _, taskInfo := range taskInfos {
		ids = append(ids, taskInfo.ID)
	}
	return ids, nil
}

func (t *TaskDb) UpdateProcessingTasks2Aborted() error {
	if err := t.Model(&TaskInfo{}).Where("task_status = ?", StatusProcessing.String()).Update("task_status", StatusAborted.String()).Error; err != nil {
		return err
	}
	return nil
}
