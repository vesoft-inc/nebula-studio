package llm

import (
	"time"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
)

func InitSchedule() {
	// TODO
	for {
		jobs := GetPendingJobs()
		RunJobs(jobs, map[string]func(job *db.LLMJob){
			"file": RunFileJob,
		})
		time.Sleep(5 * time.Second)
	}
}
