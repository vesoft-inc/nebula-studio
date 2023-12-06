package llm

import (
	"os"
	"time"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
)

type LLMJob = db.LLMJob
type LLMConfig = db.LLMConfig

func InitSchedule() {
	gqlPath := config.GetConfig().LLM.GQLPath
	if gqlPath != "" {
		// mkdir gqlPath
		err := os.MkdirAll(gqlPath, 0755)
		if err != nil {
			panic(err)
		}
	}
	for {
		jobs := GetPendingJobs()
		RunJobs(jobs, map[string]func(job *db.LLMJob){
			"file": RunFileJob,
		})
		time.Sleep(5 * time.Second)
	}
}
