package llm

import (
	"context"
	"fmt"

	"github.com/vesoft-inc/go-pkg/response"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/config"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/llm"
	"github.com/zeromicro/go-zero/core/logx"
)

type LLMService interface {
	LLMProxy(req *types.LLMRequest) (resp *types.LLMResponse, err error)
	LLMConfig(req *types.LLMConfigRequest) error
	GetLLMConfig() (resp *types.LLMResponse, err error)
	AddImportJob(req *types.LLMImportRequest) (resp *types.LLMResponse, err error)
	GetLLMImportJobs(req *types.LLMImportJobsRequest) (resp *types.LLMResponse, err error)
	HandleLLMImportJob(req *types.HandleLLMImportRequest) (resp *types.LLMResponse, err error)
	DeleteLLMImportJob(req *types.DeleteLLMImportRequest) (resp *types.LLMResponse, err error)
}

type llmService struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewLLMService(ctx context.Context, svcCtx *svc.ServiceContext) LLMService {
	return &llmService{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// LLMProxy: proxy llm request to llm server only stream false
// if you need stream ,you can use websocket
func (g *llmService) LLMProxy(req *types.LLMRequest) (resp *types.LLMResponse, err error) {
	auth := g.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	data, err := llm.Fetch(auth, req.Data, func(str string) {})
	if err != nil {
		return nil, err
	}
	resp = &types.LLMResponse{
		Data: data,
	}
	return resp, nil
}

func (g *llmService) GetLLMConfig() (resp *types.LLMResponse, err error) {
	auth := g.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	llmConfig := db.LLMConfig{
		Host:     fmt.Sprintf("%s:%d", auth.Address, auth.Port),
		UserName: auth.Username,
	}
	res := db.CtxDB.Where(llmConfig).First(&llmConfig)
	if res.RowsAffected == 0 {
		return nil, nil
	}
	return &types.LLMResponse{
		Data: response.StandardHandlerDataFieldAny(map[string]any{
			"gqlPath": config.GetConfig().LLM.GQLPath,
			"config":  llmConfig,
		}),
	}, nil
}

func (g *llmService) LLMConfig(req *types.LLMConfigRequest) (err error) {
	auth := g.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	oldConfig := db.LLMConfig{
		Host:     auth.Address,
		UserName: auth.Username,
	}
	if db.CtxDB.Find(&oldConfig).RowsAffected > 0 {
		res := db.CtxDB.Where(oldConfig).Delete(&db.LLMConfig{}, oldConfig.ID)
		if res.Error != nil {
			return res.Error
		}
	}
	llmConfig := db.LLMConfig{
		URL:                req.URL,
		Key:                req.Key,
		APIType:            db.APIType(req.APIType),
		Config:             req.Config,
		Host:               fmt.Sprintf("%s:%d", auth.Address, auth.Port),
		UserName:           auth.Username,
		ContextLengthLimit: req.MaxContextLength,
	}
	res := db.CtxDB.Create(&llmConfig)
	if res.Error != nil {
		return res.Error
	}
	return nil
}
