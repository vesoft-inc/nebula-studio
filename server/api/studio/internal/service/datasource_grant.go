package service

import (
	"errors"
	"strings"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"gorm.io/gorm/clause"
)

func (d *datasourceService) ListGrants(request types.DatasourceGrantsRequest) (*types.DatasourceGrantsData, error) {
	dbs, err := d.findOne(request.DatasourceID)
	if err != nil {
		return nil, err
	}
	if err := d.checkGrantManagePermission(dbs); err != nil {
		return nil, err
	}
	var grants []db.DatasourceGrant
	result := db.CtxDB.Where("datasource_b_id = ?", request.DatasourceID).Order("grantee_username asc").Find(&grants)
	if result.Error != nil {
		return nil, d.gormErrorWrapper(result.Error)
	}
	items := make([]types.DatasourceGrantItem, 0, len(grants))
	for _, grant := range grants {
		items = append(items, types.DatasourceGrantItem{Username: grant.GranteeUsername})
	}
	return &types.DatasourceGrantsData{List: items}, nil
}

func (d *datasourceService) AddGrants(request types.DatasourceGrantAddRequest) error {
	dbs, err := d.findOne(request.DatasourceID)
	if err != nil {
		return err
	}
	if err := d.ensureDatasourceGrantSupported(dbs); err != nil {
		return err
	}
	if err := d.checkGrantManagePermission(dbs); err != nil {
		return err
	}
	usernames := sanitizeGrantUsernames(request.Usernames)
	if len(usernames) == 0 {
		return nil
	}
	owner := dbs.Username
	entries := make([]db.DatasourceGrant, 0, len(usernames))
	for _, username := range usernames {
		if username == owner || username == "root" {
			continue
		}
		entries = append(entries, db.DatasourceGrant{
			DatasourceBID:   request.DatasourceID,
			GranteeUsername: username,
			Host:            dbs.Host,
		})
	}
	if len(entries) == 0 {
		return nil
	}
	result := db.CtxDB.Clauses(clause.OnConflict{DoNothing: true}).Create(&entries)
	if result.Error != nil {
		return d.gormErrorWrapper(result.Error)
	}
	return nil
}

func (d *datasourceService) RemoveGrants(request types.DatasourceGrantRemoveRequest) error {
	dbs, err := d.findOne(request.DatasourceID)
	if err != nil {
		return err
	}
	if err := d.ensureDatasourceGrantSupported(dbs); err != nil {
		return err
	}
	if err := d.checkGrantManagePermission(dbs); err != nil {
		return err
	}
	usernames := sanitizeGrantUsernames(request.Usernames)
	if len(usernames) == 0 {
		return nil
	}
	result := db.CtxDB.Where("datasource_b_id = ? AND grantee_username IN (?)", request.DatasourceID, usernames).Delete(&db.DatasourceGrant{})
	if result.Error != nil {
		return d.gormErrorWrapper(result.Error)
	}
	return nil
}

func (d *datasourceService) checkReadablePermission(dbs *db.Datasource) error {
	user := d.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	if user.Username == "root" || dbs.Username == user.Username {
		return nil
	}
	var count int64
	result := db.CtxDB.Model(&db.DatasourceGrant{}).
		Where("datasource_b_id = ? AND grantee_username = ? AND host = ?", dbs.BID, user.Username, dbs.Host).
		Count(&count)
	if result.Error != nil {
		return d.gormErrorWrapper(result.Error)
	}
	if count == 0 {
		return ecode.WithErrorMessage(ecode.ErrForbidden, errors.New("permission denied"), "no permission to access datasource")
	}
	return nil
}

func (d *datasourceService) checkGrantManagePermission(dbs *db.Datasource) error {
	user := d.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	if user.Username == "root" || dbs.Username == user.Username {
		return nil
	}
	return ecode.WithErrorMessage(ecode.ErrForbidden, errors.New("permission denied"), "no permission to manage datasource grants")
}

func (d *datasourceService) ensureDatasourceGrantSupported(dbs *db.Datasource) error {
	switch dbs.Type {
	case "s3", "sftp":
		return nil
	default:
		return ecode.WithErrorMessage(ecode.ErrBadRequest, errors.New("unsupported datasource type"), "grants only support s3 and sftp")
	}
}

func sanitizeGrantUsernames(usernames []string) []string {
	unique := map[string]bool{}
	result := make([]string, 0, len(usernames))
	for _, username := range usernames {
		u := strings.TrimSpace(username)
		if u == "" || unique[u] {
			continue
		}
		unique[u] = true
		result = append(result, u)
	}
	return result
}
