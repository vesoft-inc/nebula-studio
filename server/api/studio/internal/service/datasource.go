package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/filestore"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/core/logx"
)

type (
	DatasourceService interface {
		Add(request types.DatasourceAddRequest) (*types.DatasourceAddData, error)
		Update(request types.DatasourceUpdateRequest) error
		List(request types.DatasourceListRequest) (*types.DatasourceData, error)
		Remove(request types.DatasourceRemoveRequest) error
		BatchRemove(request types.DatasourceBatchRemoveRequest) error
		ListContents(request types.DatasourceListContentsRequest) (*types.DatasourceListContentsData, error)
		PreviewFile(request types.DatasourcePreviewFileRequest) (*types.DatasourcePreviewFileData, error)
	}

	datasourceService struct {
		logx.Logger
		ctx              context.Context
		svcCtx           *svc.ServiceContext
		gormErrorWrapper utils.GormErrorWrapper
	}
)

// TODO: make it configurable
const cipher = "6b6579736f6d6574616c6b6579736f6d"

func NewDatasourceService(ctx context.Context, svcCtx *svc.ServiceContext) DatasourceService {
	return &datasourceService{
		Logger:           logx.WithContext(ctx),
		ctx:              ctx,
		svcCtx:           svcCtx,
		gormErrorWrapper: utils.GormErrorWithLogger(ctx),
	}
}

func (d *datasourceService) Add(request types.DatasourceAddRequest) (*types.DatasourceAddData, error) {
	typ := request.Type
	platform := request.Platform
	var cfg interface{}
	switch typ {
	case "s3":
		cfg = request.S3Config
	case "sftp":
		cfg = request.SFTPConfig
	default:
		return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, nil, "Invalid datasource type")
	}
	cfgStr, crypto, err := validate(typ, platform, cfg)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, err)
	}
	id, err := d.save(request.Type, request.Name, request.Platform, cfgStr, crypto)
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, err)
	}
	return &types.DatasourceAddData{
		ID: id,
	}, nil
}

func (d *datasourceService) Update(request types.DatasourceUpdateRequest) error {
	datasourceId := request.ID
	dbs, err := d.findOne(datasourceId)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrBadRequest, err, "find data error")
	}
	typ := request.Type
	platform := request.Platform
	var cfg interface{}
	switch typ {
	case "s3":
		s3Config := request.S3Config
		if s3Config.AccessSecret == "" {
			s3Config.AccessSecret = dbs.Secret
		}
		cfg = &types.DatasourceS3Config{
			AccessKey:    s3Config.AccessKey,
			AccessSecret: s3Config.AccessSecret,
			Endpoint:     s3Config.Endpoint,
			Bucket:       s3Config.Bucket,
			Region:       s3Config.Region,
		}
	case "sftp":
		sftpCfg := request.SFTPConfig
		if sftpCfg.Password == "" {
			sftpCfg.Password = dbs.Secret
		}
		cfg = &types.DatasourceSFTPConfig{
			Host:     sftpCfg.Host,
			Port:     sftpCfg.Port,
			Username: sftpCfg.Username,
			Password: sftpCfg.Password,
		}
	default:
		return ecode.WithErrorMessage(ecode.ErrBadRequest, nil, "Invalid datasource type")
	}
	cfgStr, crypto, err := validate(typ, platform, cfg)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrBadRequest, err)
	}
	err = d.update(datasourceId, request.Type, request.Platform, request.Name, cfgStr, crypto)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
	}
	return nil
}

func (d *datasourceService) List(request types.DatasourceListRequest) (*types.DatasourceData, error) {
	user := d.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := user.Address + ":" + strconv.Itoa(user.Port)
	var dbsList []db.Datasource
	result := db.CtxDB.Where("host = ?", host).
		Where("username = ?", user.Username)
	if request.Type != "" {
		result = result.Where("type = ?", request.Type)
	}
	result = result.Order("create_time desc").Find(&dbsList)
	if result.Error != nil {
		return nil, d.gormErrorWrapper(result.Error)
	}
	items := make([]types.DatasourceConfig, 0)
	for _, item := range dbsList {
		config := types.DatasourceConfig{
			ID:         item.ID,
			Type:       item.Type,
			Platform:   item.Platform,
			Name:       item.Name,
			CreateTime: item.CreateTime.UnixMilli(),
		}
		switch config.Type {
		case "s3":
			config.S3Config = &types.DatasourceS3Config{}
			jsonConfig := item.Config
			if err := json.Unmarshal([]byte(jsonConfig), &config.S3Config); err != nil {
				return nil, ecode.WithInternalServer(err, "parse json failed")
			}
		case "sftp":
			config.SFTPConfig = &types.DatasourceSFTPConfig{}
			jsonConfig := item.Config
			if err := json.Unmarshal([]byte(jsonConfig), &config.SFTPConfig); err != nil {
				return nil, ecode.WithInternalServer(err, "parse json failed")
			}
		}
		items = append(items, config)
	}

	return &types.DatasourceData{
		List: items,
	}, nil
}

func (d *datasourceService) Remove(request types.DatasourceRemoveRequest) error {
	user := d.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	result := db.CtxDB.Delete(&db.Datasource{
		ID:       request.ID,
		Username: user.Username,
	})

	if result.Error != nil {
		return d.gormErrorWrapper(result.Error)
	}

	if result.RowsAffected == 0 {
		return ecode.WithErrorMessage(ecode.ErrBadRequest, fmt.Errorf("test"), "there is available item to delete")
	}

	return nil
}

func contains(s []int, e int) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func (d *datasourceService) BatchRemove(request types.DatasourceBatchRemoveRequest) error {
	user := d.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	var existingIDs []int
	db.CtxDB.Model(&db.Datasource{}).Where("id in (?)", request.IDs).Pluck("id", &existingIDs)
	if len(existingIDs) != len(request.IDs) {
		var missingIDs []int
		for _, id := range request.IDs {
			if !contains(existingIDs, id) {
				missingIDs = append(missingIDs, id)
			}
		}
		return ecode.WithErrorMessage(ecode.ErrBadRequest, fmt.Errorf("some data are not found: %v", missingIDs))
	}
	result := db.CtxDB.Where("id IN (?) AND username = ?", request.IDs, user.Username).Delete(&db.Datasource{})
	if result.Error != nil {
		return d.gormErrorWrapper(result.Error)
	}

	if result.RowsAffected == 0 {
		return ecode.WithErrorMessage(ecode.ErrBadRequest, fmt.Errorf("no data found"))
	}

	return nil
}

func (d *datasourceService) ListContents(request types.DatasourceListContentsRequest) (*types.DatasourceListContentsData, error) {
	datasourceId := request.DatasourceID
	dbs, err := d.findOne(datasourceId)
	if err != nil {
		return nil, err
	}
	store, err := d.getFileStore(dbs)
	if err != nil {
		return nil, err
	}
	fileList, err := store.ListFiles(request.Path)
	defer store.Close()
	list := make([]types.FileConfig, 0)
	for _, item := range fileList {
		list = append(list, types.FileConfig{
			Name: item.Name,
			Size: item.Size,
			Type: item.Type,
		})
	}
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, err, "listFiles failed")
	}
	return &types.DatasourceListContentsData{
		List: list,
	}, nil
}

func (d *datasourceService) PreviewFile(request types.DatasourcePreviewFileRequest) (*types.DatasourcePreviewFileData, error) {
	dbs, err := d.findOne(request.DatasourceID)
	if err != nil {
		return nil, err
	}
	store, err := d.getFileStore(dbs)
	if err != nil {
		return nil, err
	}
	// read three lines
	contents, err := store.ReadFile(request.Path, 0, 4)
	defer store.Close()
	if err != nil {
		return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, err, "readFiles failed")
	}

	return &types.DatasourcePreviewFileData{
		Contents: contents,
	}, nil
}

func (d *datasourceService) findOne(datasourceId int) (*db.Datasource, error) {
	var dbs db.Datasource
	result := db.CtxDB.Where("id = ?", datasourceId).
		First(&dbs)
	if result.Error != nil {
		return nil, d.gormErrorWrapper(result.Error)
	}
	if result.RowsAffected == 0 {
		return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, nil, "datasource don't exist")
	}

	secret, err := utils.Decrypt(dbs.Secret, []byte(cipher))
	if err != nil {
		return nil, err
	}
	dbs.Secret = string(secret)

	return &dbs, nil
}

func (d *datasourceService) save(typ, name, platform, config, secret string) (id int, err error) {
	user := d.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := user.Address + ":" + strconv.Itoa(user.Port)
	dbs := &db.Datasource{
		Type:     typ,
		Platform: platform,
		Name:     name,
		Config:   config,
		Secret:   secret,
		Host:     host,
		Username: user.Username,
	}
	result := db.CtxDB.Create(dbs)
	if result.Error != nil {
		return 0, d.gormErrorWrapper(result.Error)
	}
	return int(dbs.ID), nil
}
func (d *datasourceService) update(id int, typ, platform, name, config, secret string) (err error) {
	user := d.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := user.Address + ":" + strconv.Itoa(user.Port)
	result := db.CtxDB.Model(&db.Datasource{ID: id}).Updates(map[string]interface{}{
		"type":     typ,
		"name":     name,
		"platform": platform,
		"config":   config,
		"secret":   secret,
		"host":     host,
		"username": user.Username,
	})
	if result.Error != nil {
		return d.gormErrorWrapper(result.Error)
	}
	return nil
}

// TODO: cache the store connection to improve the request handle speed by the go-zero session
func (d *datasourceService) getFileStore(dbs *db.Datasource) (filestore.FileStore, error) {
	var config interface{}
	if err := json.Unmarshal([]byte(dbs.Config), &config); err != nil {
		return nil, ecode.WithInternalServer(err, "parse the datasource config error")
	}
	store, err := filestore.NewFileStore(dbs.Type, dbs.Config, dbs.Secret, dbs.Platform)
	if err != nil {
		d.Logger.Errorf("create the file store error")
		return nil, ecode.WithInternalServer(err, "create the file store error")
	}

	return store, nil
}

func formatDatasourceConfig(config interface{}, password string) (string, string, error) {
	cfgStr, err := json.Marshal(config)
	if err != nil {
		return "", "", fmt.Errorf("json stringify config error: %v", err)
	}
	crypto, err := utils.Encrypt([]byte(password), []byte(cipher))
	if err != nil {
		return "", "", fmt.Errorf("encrypt password error: %v", err)
	}
	return string(cfgStr), crypto, nil
}

func validate(typ string, platform string, config interface{}) (string, string, error) {
	switch typ {
	case "s3":
		cfg := config.(*types.DatasourceS3Config)
		endpoint, parsedBucket, err := utils.ParseEndpoint(platform, cfg.Endpoint)
		if err != nil {
			return "", "", err
		}
		if parsedBucket != "" && cfg.Bucket != parsedBucket {
			return "", "", errors.New("bucket name in endpoint and bucket name in config are different")
		}
		cfg.Endpoint = endpoint
		err = validateS3(platform, cfg)
		if err != nil {
			return "", "", err
		}
		secret := cfg.AccessSecret
		cfg.AccessSecret = ""
		cfgStr, crypto, err := formatDatasourceConfig(config, secret)
		return cfgStr, crypto, err
	case "sftp":
		cfg := config.(*types.DatasourceSFTPConfig)
		err := validateSftp(cfg)
		if err != nil {
			return "", "", err
		}
		secret := cfg.Password
		cfg.Password = ""
		cfgStr, crypto, err := formatDatasourceConfig(config, secret)
		return cfgStr, crypto, err
	default:
		return "", "", errors.New("unsupported datasource type")
	}
}

func validateSftp(cfg *types.DatasourceSFTPConfig) error {
	store, err := filestore.NewSftpStore(cfg.Host, cfg.Port, cfg.Username, cfg.Password)
	if err != nil {
		return fmt.Errorf("connect the sftp client error: %s", err)
	}
	store.SftpClient.Close()
	return nil
}

func validateS3(platform string, cfg *types.DatasourceS3Config) error {
	_, err := filestore.NewS3Store(platform, cfg.Endpoint, cfg.Region, cfg.Bucket, cfg.AccessKey, cfg.AccessSecret)
	if err != nil {
		return fmt.Errorf("connect the s3 client error: %s", err)
	}
	return nil
}
