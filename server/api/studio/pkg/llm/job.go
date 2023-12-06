package llm

import (
	"sync"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
)

var (
	RunningJobMap = make(map[string]*db.LLMJob)
	mu            sync.Mutex
)

func RunJobs(jobs []*db.LLMJob, JobRunnerMap map[string]func(job *db.LLMJob)) {
	for _, job := range jobs {
		job.Status = base.LLMStatusRunning
		err := db.CtxDB.Save(job).Error
		if err != nil {
			logx.Errorf("failed to update job status: %v", err)
		}
		mu.Lock()
		RunningJobMap[job.JobID] = job
		mu.Unlock()
		go func(job *db.LLMJob) {
			defer func() {
				mu.Lock()
				delete(RunningJobMap, job.JobID)
				mu.Unlock()
			}()
			runner := JobRunnerMap[job.JobType]
			if runner != nil {
				runner(job)
			}
		}(job)
	}
}

func IsRunningJobStopped(jobID string) bool {
	mu.Lock()
	defer mu.Unlock()
	job, ok := RunningJobMap[jobID]
	if ok {
		return job.Status == base.LLMStatusCancel
	}
	return false
}

func ChangeRunningJobStatus(jobID string, status base.LLMStatus) {
	mu.Lock()
	defer mu.Unlock()
	job, ok := RunningJobMap[jobID]
	if ok {
		job.Status = status
	}
}

func GetRunningJob(jobID string) *db.LLMJob {
	mu.Lock()
	defer mu.Unlock()
	job, ok := RunningJobMap[jobID]
	if ok {
		return job
	}
	return nil
}

func GetPendingJobs() []*db.LLMJob {
	var jobs []*db.LLMJob
	err := db.CtxDB.Where("status = ?", base.LLMStatusPending).Find(&jobs).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		logx.Errorf("failed to get pending jobs: %v", err)
	}

	return jobs
}
