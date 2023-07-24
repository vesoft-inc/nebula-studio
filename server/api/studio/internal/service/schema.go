package service

import (
	"context"
	"strconv"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/core/logx"
	"gorm.io/gorm"
)

var _ SchemaService = (*schemaService)(nil)

type (
	SchemaService interface {
		GetSchemaSnapshot(request types.GetSchemaSnapshotRequest) (*types.SchemaSnapshot, error)
		UpdateSchemaSnapshot(request types.UpdateSchemaSnapshotRequest) error
	}

	schemaService struct {
		logx.Logger
		ctx              context.Context
		svcCtx           *svc.ServiceContext
		gormErrorWrapper utils.GormErrorWrapper
	}
)

func NewSchemaService(ctx context.Context, svcCtx *svc.ServiceContext) SchemaService {
	return &schemaService{
		Logger:           logx.WithContext(ctx),
		ctx:              ctx,
		svcCtx:           svcCtx,
		gormErrorWrapper: utils.GormErrorWithLogger(ctx),
	}
}

func (s *schemaService) UpdateSchemaSnapshot(request types.UpdateSchemaSnapshotRequest) error {
	auth := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	var data *db.SchemaSnapshot
	filters := db.CtxDB.Where("host = ?", host)
	filters = filters.Where("username = ?", auth.Username)
	result := filters.Where("space = ?", request.Space).First(&data)
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return ecode.WithErrorMessage(ecode.ErrInternalDatabase, result.Error)
	}
	if result.RowsAffected == 0 {
		snapshot := &db.SchemaSnapshot{
			BID:      s.svcCtx.IDGenerator.Generate(),
			Host:     host,
			Username: auth.Username,
			Space:    request.Space,
			Snapshot: request.Snapshot,
		}
		result = db.CtxDB.Create(snapshot)
		if result.Error != nil {
			return ecode.WithErrorMessage(ecode.ErrInternalDatabase, result.Error)
		}
	} else {
		result = db.CtxDB.Model(&db.SchemaSnapshot{}).Where("space = ? AND username = ? AND host = ?", request.Space, auth.Username, host).Update("snapshot", request.Snapshot)
		if result.Error != nil {
			return s.gormErrorWrapper(result.Error)
		}
	}
	return nil
}

func (s *schemaService) GetSchemaSnapshot(request types.GetSchemaSnapshotRequest) (*types.SchemaSnapshot, error) {
	auth := s.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	var data *db.SchemaSnapshot
	filters := db.CtxDB.Where("host = ?", host)
	filters = filters.Where("username = ?", auth.Username)
	result := filters.Where("space = ?", request.Space).First(&data)
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return nil, ecode.WithErrorMessage(ecode.ErrInternalDatabase, result.Error)
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}
	snapshot := &types.SchemaSnapshot{
		Space:      data.Space,
		Snapshot:   data.Snapshot,
		CreateTime: data.CreateTime.UnixMilli(),
		UpdateTime: data.UpdateTime.UnixMilli(),
	}
	return snapshot, nil
}
