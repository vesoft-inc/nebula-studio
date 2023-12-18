package main

import (
	"flag"
	"fmt"
	"log"
	"path"
	"path/filepath"
	"time"

	nebula_go "github.com/vesoft-inc/nebula-go/v3"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/client"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/llm"
	"github.com/zeromicro/go-zero/core/conf"
)

type Config struct {
	LLMJob struct {
		Space string
		File  string
	}
	Auth struct {
		Address  string
		Port     int
		Username string
		Password string
	}
	LLMConfig struct {
		URL                string
		Key                string
		APIType            db.APIType
		ContextLengthLimit int
	}
	GQLBatchSize   int    `json:",default=100"`
	MaxBlockSize   int    `json:",default=0"`
	PromptTemplate string `json:",default="`
}

func main() {
	configFile := flag.String("config", "config.yaml", "Configuration file for the import job")
	outputPath := flag.String("output", ".", "Output path for the import job")
	flag.Parse()
	if *configFile == "" {
		log.Fatal("config file is empty")
	}

	var c Config
	conf.MustLoad(*configFile, &c, conf.UseEnv())

	job := llm.ImportJob{
		CacheNodes: make(map[string]llm.Node),
		CacheEdges: make(map[string]map[string]llm.Edge),
		LLMJob: &db.LLMJob{
			JobID: fmt.Sprintf("%d", time.Now().UnixNano()),
			Space: c.LLMJob.Space,
			File:  c.LLMJob.File,
		},
		AuthData: &auth.AuthData{
			Address:  c.Auth.Address,
			Port:     c.Auth.Port,
			Username: c.Auth.Username,
			Password: c.Auth.Password,
		},
		LLMConfig: &llm.LLMConfig{
			URL:                c.LLMConfig.URL,
			Key:                c.LLMConfig.Key,
			APIType:            c.LLMConfig.APIType,
			ContextLengthLimit: c.LLMConfig.ContextLengthLimit,
		},
	}
	studioConfig := config.Config{
		LLM: struct {
			GQLPath        string `json:",default=./data/llm"`
			GQLBatchSize   int    `json:",default=100"`
			MaxBlockSize   int    `json:",default=0"`
			PromptTemplate string `json:",default="`
		}{
			GQLPath:        *outputPath,
			GQLBatchSize:   c.GQLBatchSize,
			MaxBlockSize:   c.MaxBlockSize,
			PromptTemplate: c.PromptTemplate,
		},
	}
	studioConfig.InitConfig()
	RunFileJob(&job)
}

func RunFileJob(llmJob *llm.ImportJob) {
	llmJob.Process = &base.Process{
		TotalSize:        0,
		CurrentSize:      0,
		Ratio:            0,
		PromptTokens:     0,
		CompletionTokens: 0,
	}

	err := llmJob.AddLogFile()
	if err != nil {
		llmJob.SetJobFailed(err)
		return
	}
	defer llmJob.CloseLogFile()
	defer func() {
		if err := recover(); err != nil {
			llmJob.WriteLogFile(fmt.Sprintf("panic: %v", err), "error")
			llmJob.SetJobFailed(err)
		}
		if llmJob.LLMJob.Status == base.LLMStatusFailed {
			log.Fatalf("job failed: %v", llmJob.Process.FailedReason)
		} else {
			log.Printf("job %s %s finished", llmJob.LLMJob.JobID, llmJob.LLMJob.Status)
		}
	}()
	go func() {
		oldRatio := float64(0)
		for {
			time.Sleep(3 * time.Second)
			if oldRatio != llmJob.Process.Ratio {
				llmJob.WriteLogFile(fmt.Sprintf("process ratio: %f", llmJob.Process.Ratio), "info")
				oldRatio = llmJob.Process.Ratio
			}
		}
	}()

	llmJob.Process.Ratio = 0.01
	connectInfo := llmJob.AuthData
	clientInfo, err := client.NewClient(connectInfo.Address, connectInfo.Port, connectInfo.Username, connectInfo.Password, nebula_go.GetDefaultConf())
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("create client error: %v", err), "error")
		return
	}
	llmJob.NSID = clientInfo.ClientID
	llmJob.Process.Ratio = 0.03

	err = llmJob.MakeSchema()
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("make schema error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	err = llmJob.GetSchemaMap()
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("get schema map error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	llmJob.Process.Ratio = 0.05

	llmJob.WriteLogFile(fmt.Sprintf("start run file job, file path: %s", llmJob.LLMJob.File), "info")

	filePath := path.Join(llmJob.LLMJob.File)
	text, err := llmJob.ReadFile(filePath)
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("read file error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	blocks, err := llmJob.SplitText(text)
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("split text error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	llmJob.Process.Ratio = 0.07
	err = llmJob.QueryBlocks(blocks)
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("query blocks error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	llmJob.Process.Ratio = 0.8

	fileName := filepath.Base(llmJob.LLMJob.File)
	gqlPath := filepath.Join(config.GetConfig().LLM.GQLPath, fmt.Sprintf("%s/%s.ngql", llmJob.LLMJob.JobID, fileName))
	gqls, err := llmJob.MakeGQLFile(gqlPath)
	if err != nil {
		llmJob.WriteLogFile(fmt.Sprintf("make gql file error: %v", err), "error")
		llmJob.SetJobFailed(err)
		return
	}
	llmJob.Process.Ratio = 0.9

	llmJob.RunGQLFile(gqls)
	llmJob.Process.Ratio = 1
	llmJob.LLMJob.Status = base.LLMStatusSuccess
}
