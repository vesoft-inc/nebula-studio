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

var _ FavoriteService = (*favoriteService)(nil)

type (
	FavoriteService interface {
		Create(request types.CreateFavoriteRequest) (*types.FavoriteIDResult, error)
		GetList() (*types.FavoriteList, error)
		Delete(request types.DeleteFavoriteRequest) error
		DeleteAll() error
	}

	favoriteService struct {
		logx.Logger
		ctx              context.Context
		svcCtx           *svc.ServiceContext
		gormErrorWrapper utils.GormErrorWrapper
	}
)

func NewFavoriteService(ctx context.Context, svcCtx *svc.ServiceContext) FavoriteService {
	return &favoriteService{
		Logger:           logx.WithContext(ctx),
		ctx:              ctx,
		svcCtx:           svcCtx,
		gormErrorWrapper: utils.GormErrorWithLogger(ctx),
	}
}

func (s *favoriteService) Create(request types.CreateFavoriteRequest) (*types.FavoriteIDResult, error) {
	auth := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	favoriteItem := &db.Favorite{
		Host:     host,
		Username: auth.Username,
		Content:  request.Content,
	}
	result := db.CtxDB.Create(favoriteItem)
	if result.Error != nil {
		return nil, s.gormErrorWrapper(result.Error)
	}
	return &types.FavoriteIDResult{
		ID: int(favoriteItem.ID),
	}, nil
}

func (s *favoriteService) Delete(request types.DeleteFavoriteRequest) error {
	result := db.CtxDB.Delete(&db.Favorite{}, request.Id)
	if result.Error != nil {
		return s.gormErrorWrapper(result.Error)
	}
	return nil
}
func (s *favoriteService) DeleteAll() error {
	auth := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	result := db.CtxDB.Where("host = ?", host).Delete(&db.Favorite{})
	if result.Error != nil {
		return s.gormErrorWrapper(result.Error)
	}
	return nil
}

func (s *favoriteService) GetList() (*types.FavoriteList, error) {
	auth := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	var favoriteList []db.Favorite
	filters := db.CtxDB.Where("host = ?", host)
	filters = filters.Where("username = ?", auth.Username)
	result := filters.Order("create_time desc").Find(&favoriteList)
	if result.Error != nil {
		return nil, s.gormErrorWrapper(result.Error)
	}
	items := make([]types.FavoriteItem, 0)
	for _, favoriteItem := range favoriteList {
		items = append(items, types.FavoriteItem{
			ID:         favoriteItem.ID,
			Content:    favoriteItem.Content,
			CreateTime: favoriteItem.CreateTime.UnixMilli(),
		})
	}
	var total int64
	db.CtxDB.Model(&db.Favorite{}).Where(filters).Count(&total)
	return &types.FavoriteList{
		Items: items,
		Total: total,
	}, nil
}
