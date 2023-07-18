package service

import (
	"context"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/gpt"
	"github.com/zeromicro/go-zero/core/logx"
)

type GPTService interface {
	GPTProxy(req *types.GPTRequest) (resp *types.GPTResponse, err error)
	GPTConfig(req *types.GPTConfigRequest) error
	GetGPTConfig() (resp *types.GPTConfigRequest, err error)
}

type gptService struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewGPTService(ctx context.Context, svcCtx *svc.ServiceContext) GPTService {
	return &gptService{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

// GPTProxy: proxy gpt request to gpt server only stream false
// if you need stream ,you can use websocket
func (g *gptService) GPTProxy(req *types.GPTRequest) (resp *types.GPTResponse, err error) {
	data, err := gpt.Fetch(req.Data, func(str string) {})
	if err != nil {
		return nil, err
	}
	resp = &types.GPTResponse{
		Data: data,
	}
	return resp, nil
}

func (g *gptService) GetGPTConfig() (resp *types.GPTConfigRequest, err error) {
	config := db.GPTConfig{}
	res := db.CtxDB.First(&config)
	if res.RowsAffected == 0 {
		return nil, res.Error
	}
	resp = &types.GPTConfigRequest{
		URL:        config.URL,
		Key:        config.Key,
		GPTVersion: string(config.GPTVersion),
		APIType:    string(config.APIType),
		Config:     config.Config,
	}
	return resp, nil
}

func (g *gptService) GPTConfig(req *types.GPTConfigRequest) (err error) {
	oldConfig := db.GPTConfig{}
	if db.CtxDB.Find(&oldConfig).RowsAffected > 0 {
		res := db.CtxDB.Delete(&db.GPTConfig{}, oldConfig.ID)
		if res.Error != nil {
			return res.Error
		}
	}
	gptConfig := db.GPTConfig{
		URL:        req.URL,
		Key:        req.Key,
		GPTVersion: db.ModelVersion(req.GPTVersion),
		APIType:    db.APIType(req.APIType),
		Config:     req.Config,
	}
	res := db.CtxDB.Create(&gptConfig)
	if res.Error != nil {
		return res.Error
	}
	gpt.Init()
	return nil
}
