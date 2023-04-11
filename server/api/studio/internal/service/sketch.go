package service

import (
	"context"
	"strconv"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/core/logx"
)

var _ SketchService = (*sketchService)(nil)

type (
	SketchService interface {
		Init(request types.InitSketchRequest) (*types.SketchIDResult, error)
		GetList(request types.GetSketchesRequest) (*types.SketchList, error)
		Delete(request types.DeleteSketchRequest) error
		Update(request types.UpdateSketchRequest) error
	}

	sketchService struct {
		logx.Logger
		ctx              context.Context
		svcCtx           *svc.ServiceContext
		gormErrorWrapper utils.GormErrorWrapper
	}
)

func NewSketchService(ctx context.Context, svcCtx *svc.ServiceContext) SketchService {
	return &sketchService{
		Logger:           logx.WithContext(ctx),
		ctx:              ctx,
		svcCtx:           svcCtx,
		gormErrorWrapper: utils.GormErrorWithLogger(ctx),
	}
}

func (s *sketchService) Init(request types.InitSketchRequest) (*types.SketchIDResult, error) {
	auth := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	sketch := &db.Sketch{
		Host:     host,
		Username: auth.Username,
		Name:     request.Name,
		Schema:   request.Schema,
		Snapshot: request.Snapshot,
	}
	result := db.CtxDB.Create(sketch)
	if result.Error != nil {
		return nil, s.gormErrorWrapper(result.Error)
	}
	return &types.SketchIDResult{
		ID: int(sketch.ID),
	}, nil
}

func (s *sketchService) Delete(request types.DeleteSketchRequest) error {
	result := db.CtxDB.Delete(&db.Sketch{}, request.ID)
	if result.Error != nil {
		return s.gormErrorWrapper(result.Error)
	}
	return nil
}

func (s *sketchService) Update(request types.UpdateSketchRequest) error {
	result := db.CtxDB.Model(&db.Sketch{ID: request.ID}).Updates(map[string]interface{}{
		"name":     request.Name,
		"schema":   request.Schema,
		"snapshot": request.Snapshot,
	})
	if result.Error != nil {
		return s.gormErrorWrapper(result.Error)
	}
	return nil
}

func (s *sketchService) GetList(request types.GetSketchesRequest) (*types.SketchList, error) {
	auth := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	cluster := auth.Cluster
	var sketchList []db.Sketch
	filters := db.CtxDB.Where("host in (?)", cluster)
	filters = filters.Where("username = ?", auth.Username)
	if request.Keyword != "" {
		filters = filters.Where("name LIKE ?", "%"+request.Keyword+"%")
	}
	result := filters.Scopes(utils.Paginate(request.Page, request.PageSize)).Order("create_time desc").Find(&sketchList)
	if result.Error != nil {
		return nil, s.gormErrorWrapper(result.Error)
	}
	items := make([]types.Sketch, 0)
	for _, sketch := range sketchList {
		items = append(items, types.Sketch{
			ID:         sketch.ID,
			Name:       sketch.Name,
			Schema:     sketch.Schema,
			Snapshot:   sketch.Snapshot,
			Host:       sketch.Host,
			CreateTime: sketch.CreateTime.UnixMilli(),
			UpdateTime: sketch.UpdateTime.UnixMilli(),
		})
	}
	var total int64
	db.CtxDB.Model(&db.Sketch{}).Where(filters).Count(&total)
	return &types.SketchList{
		Items:    items,
		Total:    total,
		Page:     request.Page,
		PageSize: request.PageSize,
	}, nil
}
