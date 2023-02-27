package service

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/pkg/sftp"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/filestore"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/core/logx"
	"golang.org/x/crypto/ssh"
	"strconv"
)

type (
	DatasourceService interface {
		Add(request types.DatasourceAddRequest) (*types.DatasourceAddData, error)
		List() (*types.DatasourceData, error)
		Remove(request types.DatasourceRemoveRequest) error
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
	switch request.Type {
	case "s3":
		c := request.S3Config
		if err := d.testConnectionS3(c.Endpoint, c.Region, c.AccessKey, c.AccessSecret); err != nil {
			return nil, err
		}
		secret := c.AccessSecret
		c.AccessSecret = ""
		cstr, err := json.Marshal(c)
		if err != nil {
			return nil, ecode.WithBadRequest(err, "json stringify error")
		}
		crypto, err := utils.Encrypt([]byte(secret), []byte(cipher))
		id, err := d.save(request.Type, request.Name, string(cstr), crypto)
		if err != nil {
			return nil, err
		}
		return &types.DatasourceAddData{
			ID: id,
		}, nil
		break
	case "sftp":
		c := request.SFTPConfig
		if err := d.testConnectionSFTP(c.Host, c.Port, c.Username, c.Password); err != nil {
			return nil, err
		}
		pwd := c.Password
		c.Password = ""
		cstr, err := json.Marshal(c)
		if err != nil {
			d.Logger.Errorf("json stringify error", c)
			return nil, ecode.WithBadRequest(err, "json stringify error")
		}
		crypto, err := utils.Encrypt([]byte(pwd), []byte(cipher))
		id, err := d.save(request.Type, request.Name, string(cstr), crypto)
		if err != nil {
			return nil, err
		}
		return &types.DatasourceAddData{
			ID: id,
		}, nil
		break
	}
	return nil, ecode.WithErrorMessage(ecode.ErrBadRequest, nil, "datasource type can't support'")
}

func (d *datasourceService) List() (*types.DatasourceData, error) {
	user := d.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := user.Address + ":" + strconv.Itoa(user.Port)
	var dbsList []db.Datasource
	result := db.CtxDB.Where("host = ?", host).
		Where("username = ?", user.Username).
		Order("create_time desc").
		Find(&dbsList)
	if result.Error != nil {
		return nil, d.gormErrorWrapper(result.Error)
	}
	items := make([]types.DatasourceConfig, 0)
	for _, item := range dbsList {
		config := types.DatasourceConfig{
			ID:         item.ID,
			Type:       item.Type,
			Name:       item.Name,
			CreateTime: item.CreateTime.UnixMilli(),
		}
		switch config.Type {
		case "s3":
			config.S3Config = types.DatasourceS3Config{}
			jsonConfig := item.Config
			if err := json.Unmarshal([]byte(jsonConfig), &config.S3Config); err != nil {
				return nil, ecode.WithInternalServer(err, "parse json failed")
			}
			break
		case "sftp":
			config.SFTPConfig = types.DatasourceSFTPConfig{}
			jsonConfig := item.Config
			if err := json.Unmarshal([]byte(jsonConfig), &config.SFTPConfig); err != nil {
				return nil, ecode.WithInternalServer(err, "parse json failed")
			}
			break
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
		return ecode.WithBadRequest(fmt.Errorf("test"), "there is available item to delete")
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
	if err != nil {
		return nil, ecode.WithBadRequest(err, "listFiles failed")
	}
	return &types.DatasourceListContentsData{
		List: fileList,
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
	if err != nil {
		return nil, ecode.WithBadRequest(err, "readFiles failed")
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
		return nil, ecode.WithBadRequest(nil, "datasource don't exist")
	}

	secret, err := utils.Decrypt(dbs.Secret, []byte(cipher))
	if err != nil {
		return nil, err
	}
	dbs.Secret = string(secret)

	return &dbs, nil
}

func (d *datasourceService) save(typ, name, config, secret string) (id int, err error) {
	user := d.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := user.Address + ":" + strconv.Itoa(user.Port)
	dbs := &db.Datasource{
		Type:     typ,
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

// TODO: cache the store connection to improve the request handle speed by the go-zero session
func (d *datasourceService) getFileStore(dbs *db.Datasource) (filestore.FileStore, error) {
	var config interface{}
	if err := json.Unmarshal([]byte(dbs.Config), &config); err != nil {
		return nil, ecode.WithInternalServer(err, "parse the datasource config error")
	}
	store, err := filestore.NewFileStore(dbs.Type, dbs.Config, dbs.Secret)
	if err != nil {
		d.Logger.Errorf("create the file store error")
		return nil, ecode.WithInternalServer(err, "create the file store error")
	}

	return store, nil
}

func (d *datasourceService) testConnectionS3(endpoint, region, key, secret string) error {
	sess, err := session.NewSession(&aws.Config{
		Region:      aws.String(region),
		Endpoint:    aws.String(endpoint),
		Credentials: credentials.NewStaticCredentials(key, secret, ""),
	})
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrBadRequest, err, "failed to create session")
	}

	svc := s3.New(sess)
	_, err = svc.ListBuckets(nil)
	if err != nil {
		return ecode.WithErrorMessage(ecode.ErrBadRequest, err, "Failed to list buckets")
	}

	return nil
}

func (d *datasourceService) testConnectionSFTP(host string, port int, username string, password string) error {
	// create an SSH client config
	config := &ssh.ClientConfig{
		User: username,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	// connect to the remote SSH server
	conn, err := ssh.Dial("tcp", fmt.Sprintf("%s:%d", host, port), config)
	if err != nil {
		return ecode.WithBadRequest(err, "failed to dial SSH server")
	}
	defer conn.Close()

	// create an SFTP client session
	client, err := sftp.NewClient(conn)
	if err != nil {
		return ecode.WithBadRequest(err, "failed to create SFTP session")
	}
	defer client.Close()

	// test the SFTP connection by listing the remote directory
	_, err = client.ReadDir("/")
	if err != nil {
		return ecode.WithBadRequest(err, "failed to list remote directory")
	}

	return nil
}