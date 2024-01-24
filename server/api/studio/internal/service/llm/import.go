package llm

import (
	"fmt"
	"hash/fnv"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/vesoft-inc/go-pkg/response"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/llm"
	"gorm.io/datatypes"
)

func hashString(s string) string {
	h := fnv.New64a()
	h.Write([]byte(s))
	return strconv.FormatUint(h.Sum64(), 36)
}
func (g *llmService) AddImportJob(req *types.LLMImportRequest) (resp *types.LLMResponse, err error) {
	auth := g.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	config := db.LLMConfig{
		Host:     fmt.Sprintf("%s:%d", auth.Address, auth.Port),
		UserName: auth.Username,
	}
	err = db.CtxDB.Where(config).First(&config).Error
	if err != nil {
		return nil, err
	}
	space := req.Space
	runes := []rune(space)
	if len(runes) > 14 {
		runes = runes[:14]
	}
	space = string(runes)
	job := db.LLMJob{
		Space:      req.Space,
		File:       req.File,
		JobType:    req.Type,
		Status:     base.LLMStatusPending,
		Host:       config.Host,
		UserName:   config.UserName,
		UserPrompt: req.UserPrompt,
		JobID:      time.Now().Format("20060102150405000") + "_" + hashString(space),
	}
	task := &db.TaskInfo{
		BID:     job.JobID,
		LLMJob:  job,
		Space:   job.Space,
		User:    job.UserName,
		Address: job.Host,
	}
	err = db.CtxDB.Create(task).Error
	if err != nil {
		return nil, err
	}
	return &types.LLMResponse{
		Data: response.StandardHandlerDataFieldAny(job),
	}, nil
}

func (g *llmService) GetLLMImportJobs(req *types.LLMImportJobsRequest) (resp *types.LLMResponse, err error) {
	auth := g.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	config := db.LLMConfig{
		Host:     auth.Address,
		UserName: auth.Username,
	}
	err = db.CtxDB.Where(config).First(&config).Error
	if err != nil {
		return nil, err
	}

	var jobs []*db.LLMJob
	err = db.CtxDB.Where("host = ? and user_name = ?", config.Host, config.UserName).Find(&jobs).Error
	if err != nil {
		return nil, err
	}
	// find from memory to avoid db update delay
	for _, job := range jobs {
		runningJob := llm.GetRunningJob(job.JobID)
		if runningJob != nil {
			job.Process = runningJob.Process
		}
	}

	return &types.LLMResponse{
		Data: response.StandardHandlerDataFieldAny(jobs),
	}, nil
}

func (g *llmService) HandleLLMImportJob(req *types.HandleLLMImportRequest) (resp *types.LLMResponse, err error) {
	var job db.LLMJob
	err = db.CtxDB.Where("job_id = ?", req.JobID).First(&job).Error
	if err != nil {
		return nil, err
	}

	if req.Action == "cancel" {
		job.Status = base.LLMStatusCancel
		llm.ChangeRunningJobStatus(job.JobID, base.LLMStatusCancel)
	}
	if req.Action == "rerun" {
		job.Status = base.LLMStatusPending
		// datatypes.JSON
		job.Process = datatypes.JSON("{}")
		//delete log & ngql
		jobPath := filepath.Join(config.GetConfig().LLM.GQLPath, job.JobID)
		err = os.RemoveAll(jobPath)
		if err != nil {
			return nil, fmt.Errorf("remove job path error: %v", err)
		}
	}

	err = db.CtxDB.Save(&job).Error
	if err != nil {
		return nil, err
	}

	return &types.LLMResponse{
		Data: response.StandardHandlerDataFieldAny(job),
	}, nil
}

func (g *llmService) DeleteLLMImportJob(req *types.DeleteLLMImportRequest) (resp *types.LLMResponse, err error) {
	var job db.LLMJob
	err = db.CtxDB.Where("job_id = ?", req.JobID).First(&job).Error
	if err != nil {
		return nil, fmt.Errorf("get job error: %v", err)
	}

	err = db.CtxDB.Delete(&job).Error
	if err != nil {
		return nil, fmt.Errorf("delete job error: %v", err)
	}
	//delete task info
	err = db.CtxDB.Where("llm_job_id = ?", job.ID).Delete(&db.TaskInfo{}).Error
	if err != nil {
		return nil, err
	}
	//delete log & ngql
	jobPath := filepath.Join(config.GetConfig().LLM.GQLPath, job.JobID)
	err = os.RemoveAll(jobPath)
	if err != nil {
		return nil, fmt.Errorf("remove job path error: %v", err)
	}

	return &types.LLMResponse{
		Data: response.StandardHandlerDataFieldAny(job),
	}, nil
}
