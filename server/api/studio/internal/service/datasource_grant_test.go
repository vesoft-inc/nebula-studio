package service

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

const (
	testHost    = "127.0.0.1:9669"
	testAddress = "127.0.0.1"
	testPort    = 9669
)

func TestDatasourceGrantRootCanManageAndRootListOnlyRemoteTypes(t *testing.T) {
	initDatasourceGrantTestDB(t)
	insertDatasource(t, datasourceFixture{
		BID:      "ds-s3",
		Type:     "s3",
		Platform: "aws",
		Name:     "team-s3",
		Owner:    "alice",
		Config:   mustJSON(t, map[string]interface{}{"endpoint": "https://s3.us-east-1.amazonaws.com", "bucket": "b1", "accessKeyID": "ak"}),
		Secret:   mustEncryptedSecret(t, "s3-secret"),
	})
	insertDatasource(t, datasourceFixture{
		BID:      "ds-local",
		Type:     "local",
		Platform: "",
		Name:     "team-local",
		Owner:    "alice",
		Config:   "{}",
		Secret:   mustEncryptedSecret(t, "local-secret"),
	})

	rootSvc := NewDatasourceService(ctxWithUser("root"), &svc.ServiceContext{})
	err := rootSvc.AddGrants(types.DatasourceGrantAddRequest{
		DatasourceID: "ds-s3",
		Usernames:    []string{"bob", "root", "alice", " bob "},
	})
	require.NoError(t, err)

	grants, err := rootSvc.ListGrants(types.DatasourceGrantsRequest{DatasourceID: "ds-s3"})
	require.NoError(t, err)
	require.Len(t, grants.List, 1)
	require.Equal(t, "bob", grants.List[0].Username)

	rootList, err := rootSvc.List(types.DatasourceListRequest{})
	require.NoError(t, err)
	require.Len(t, rootList.List, 1)
	require.Equal(t, "ds-s3", rootList.List[0].ID)
	require.Equal(t, "alice", rootList.List[0].Creator)

	bobSvc := NewDatasourceService(ctxWithUser("bob"), &svc.ServiceContext{})
	bobList, err := bobSvc.List(types.DatasourceListRequest{})
	require.NoError(t, err)
	require.Len(t, bobList.List, 1)
	require.Equal(t, "ds-s3", bobList.List[0].ID)
}

func TestDatasourceGrantPermissionBoundaryForNonRoot(t *testing.T) {
	initDatasourceGrantTestDB(t)
	insertDatasource(t, datasourceFixture{
		BID:      "ds-sftp",
		Type:     "sftp",
		Platform: "",
		Name:     "team-sftp",
		Owner:    "alice",
		Config:   mustJSON(t, map[string]interface{}{"host": "127.0.0.1", "port": 22, "username": "u"}),
		Secret:   mustEncryptedSecret(t, "sftp-secret"),
	})

	bobSvc := NewDatasourceService(ctxWithUser("bob"), &svc.ServiceContext{})
	err := bobSvc.AddGrants(types.DatasourceGrantAddRequest{
		DatasourceID: "ds-sftp",
		Usernames:    []string{"charlie"},
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), ecode.ErrForbidden.GetMessage())

	aliceSvc := NewDatasourceService(ctxWithUser("alice"), &svc.ServiceContext{})
	err = aliceSvc.AddGrants(types.DatasourceGrantAddRequest{
		DatasourceID: "ds-sftp",
		Usernames:    []string{"bob"},
	})
	require.NoError(t, err)

	err = bobSvc.RemoveGrants(types.DatasourceGrantRemoveRequest{
		DatasourceID: "ds-sftp",
		Usernames:    []string{"bob"},
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), ecode.ErrForbidden.GetMessage())

	err = aliceSvc.RemoveGrants(types.DatasourceGrantRemoveRequest{
		DatasourceID: "ds-sftp",
		Usernames:    []string{"bob"},
	})
	require.NoError(t, err)

	grants, err := aliceSvc.ListGrants(types.DatasourceGrantsRequest{DatasourceID: "ds-sftp"})
	require.NoError(t, err)
	require.Empty(t, grants.List)
}

func TestDatasourceGrantOnlySupportsS3AndSFTP(t *testing.T) {
	initDatasourceGrantTestDB(t)
	insertDatasource(t, datasourceFixture{
		BID:      "ds-local",
		Type:     "local",
		Platform: "",
		Name:     "team-local",
		Owner:    "alice",
		Config:   "{}",
		Secret:   mustEncryptedSecret(t, "local-secret"),
	})

	aliceSvc := NewDatasourceService(ctxWithUser("alice"), &svc.ServiceContext{})
	err := aliceSvc.AddGrants(types.DatasourceGrantAddRequest{
		DatasourceID: "ds-local",
		Usernames:    []string{"bob"},
	})
	require.Error(t, err)
	require.Contains(t, err.Error(), ecode.ErrBadRequest.GetMessage())
}

type datasourceFixture struct {
	BID      string
	Type     string
	Platform string
	Name     string
	Owner    string
	Config   string
	Secret   string
}

func initDatasourceGrantTestDB(t *testing.T) {
	t.Helper()
	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())
	gdb, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, gdb.AutoMigrate(&db.Datasource{}, &db.DatasourceGrant{}))
	db.CtxDB = gdb
}

func insertDatasource(t *testing.T, f datasourceFixture) {
	t.Helper()
	require.NoError(t, db.CtxDB.Create(&db.Datasource{
		BID:      f.BID,
		Type:     f.Type,
		Platform: f.Platform,
		Name:     f.Name,
		Config:   f.Config,
		Secret:   f.Secret,
		Host:     testHost,
		Username: f.Owner,
	}).Error)
}

func mustEncryptedSecret(t *testing.T, secret string) string {
	t.Helper()
	enc, err := utils.Encrypt([]byte(secret), []byte(cipher))
	require.NoError(t, err)
	return enc
}

func mustJSON(t *testing.T, v interface{}) string {
	t.Helper()
	bs, err := json.Marshal(v)
	require.NoError(t, err)
	return string(bs)
}

func ctxWithUser(username string) context.Context {
	return context.WithValue(context.Background(), auth.CtxKeyUserInfo{}, &auth.AuthData{
		Address:  testAddress,
		Port:     testPort,
		Username: username,
	})
}
