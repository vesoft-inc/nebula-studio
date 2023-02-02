package service

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"

	"github.com/axgle/mahonia"
	"github.com/saintfish/chardet"
	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
	"github.com/zeromicro/go-zero/core/logx"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

const (
	defaultMulipartMemory = 500 << 20 // 500 MB
)

var (
	errNoCharset             = errors.New("this charset can not be changed")
	_            FileService = (*fileService)(nil)
)

type fileConfig struct {
	Name       string
	WithHeader bool
	Delimiter  string
}

type (
	FileService interface {
		FileUpload() error
		FileDestroy(request types.FileDestroyRequest) error
		FilesIndex() (*types.FilesIndexData, error)
		FileConfigUpdate(request types.FileConfigUpdateRequest) error
	}

	fileService struct {
		logx.Logger
		ctx              context.Context
		svcCtx           *svc.ServiceContext
		gormErrorWrapper utils.GormErrorWrapper
	}
)

func NewFileService(ctx context.Context, svcCtx *svc.ServiceContext) FileService {
	return &fileService{
		Logger:           logx.WithContext(ctx),
		ctx:              ctx,
		svcCtx:           svcCtx,
		gormErrorWrapper: utils.GormErrorWithLogger(ctx),
	}
}

func (f *fileService) FileDestroy(request types.FileDestroyRequest) error {
	dir := f.svcCtx.Config.File.UploadDir
	for _, name := range request.Names {
		target := filepath.Join(dir, name)
		if _, err := os.Stat(target); err != nil {
			logx.Infof("del file error %v", err)
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
		}
		//	if target is directory, it is not empty
		if err := os.Remove(target); err != nil {
			logx.Infof("del file error %v", err)
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err)
		}
		// delete db record
		var file db.File
		result := db.CtxDB.Where("name = ?", name).First(&file)
		if result.Error == gorm.ErrRecordNotFound {
			continue
		} else if result.Error != nil {
			return f.gormErrorWrapper(result.Error)
		}
		result = db.CtxDB.Delete(&file)
		if result.Error != nil {
			return f.gormErrorWrapper(result.Error)
		}
	}
	return nil
}

func (f *fileService) FilesIndex() (data *types.FilesIndexData, err error) {
	data = &types.FilesIndexData{
		List: []types.FileStat{},
	}
	dir := f.svcCtx.Config.File.UploadDir
	filesInfo, err := ioutil.ReadDir(dir)
	if err != nil {
		logx.Infof("open files error %v", err)
		return nil, err
	}

	for _, fileInfo := range filesInfo {
		if fileInfo.IsDir() {
			continue
		}
		var fileConfig db.File
		result := db.CtxDB.Where("name = ?", fileInfo.Name()).First(&fileConfig)
		if result.Error != nil {
			logx.Errorf("get file config record in db error %v", result.Error)
			fileConfig.Delimiter = ","
			fileConfig.WithHeader = false
		}
		path := filepath.Join(dir, fileInfo.Name())
		file, err := os.Open(path)
		if err != nil {
			logx.Infof("open files error %v", err)
			continue
		}
		reader := bufio.NewReader(file)
		sample := ""
		for count := 0; count < 5; count++ {
			line, _, err := reader.ReadLine()
			if err != nil {
				break
			}
			sample += string(line) + "\r\n"
		}
		file.Close()
		data.List = append(data.List, types.FileStat{
			Sample:     sample,
			Name:       fileInfo.Name(),
			Size:       fileInfo.Size(),
			WithHeader: fileConfig.WithHeader,
			Delimiter:  fileConfig.Delimiter,
		})
	}
	return data, nil
}

func (f *fileService) FileConfigUpdate(request types.FileConfigUpdateRequest) error {
	File := &db.File{}
	result := db.CtxDB.Where("name = ?", request.Name).First(File)
	if result.Error == gorm.ErrRecordNotFound {
		// in case user upload file through ftp, without init file record in db
		auth := f.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
		host := auth.Address + ":" + strconv.Itoa(auth.Port)
		File = &db.File{
			Name:       request.Name,
			WithHeader: request.WithHeader,
			Delimiter:  request.Delimiter,
			Host:       host,
			Username:   auth.Username,
		}
		createResult := db.CtxDB.Create(File)
		if createResult.Error != nil {
			return ecode.WithErrorMessage(ecode.ErrInternalDatabase, createResult.Error)
		}
		return nil
	}
	if result.Error != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalDatabase, result.Error)
	}
	result = db.CtxDB.Model(File).Updates(map[string]interface{}{"with_header": request.WithHeader, "delimiter": request.Delimiter})
	if result.Error != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalDatabase, result.Error)
	}
	return nil
}
func (f *fileService) FileUpload() error {
	dir := f.svcCtx.Config.File.UploadDir
	auth := f.ctx.Value(auth.CtxKeyUserInfo{}).(*auth.AuthData)
	host := auth.Address + ":" + strconv.Itoa(auth.Port)
	_, err := os.Stat(dir)
	if err != nil {
		if os.IsNotExist(err) {
			os.MkdirAll(dir, os.ModePerm)
		} else {
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "upload failed")
		}
	}

	httpReq, ok := middleware.GetRequest(f.ctx)
	if !ok {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, fmt.Errorf("unset KeepRequest"), "upload failed")
	}

	files, _, err := UploadFormFiles(httpReq, dir, auth, host)
	if err != nil {
		logx.Infof("upload file error:%v", err)
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "upload failed")
	}
	for _, file := range files {
		if file.Size == 0 {
			continue
		}
		charSet, err := checkCharset(file)
		if err != nil {
			logx.Infof("upload file error, check charset fail:%v", err)
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "upload failed")
		}
		if charSet == "UTF-8" {
			continue
		}
		path := filepath.Join(dir, file.Filename)
		if err = changeFileCharset2UTF8(path, charSet); err != nil {
			logx.Infof("upload file error:%v", err)
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "upload failed")
		}
	}
	logx.Infof("upload %d files", len(files))
	return nil
}

func UploadFormFiles(r *http.Request, destDirectory string, auth *auth.AuthData, host string) (uploaded []*multipart.FileHeader, n int64, err error) {
	err = r.ParseMultipartForm(defaultMulipartMemory)
	if err != nil {
		return nil, 0, err
	}

	if r.MultipartForm != nil {
		configMap := make(map[string]fileConfig)
		if configs := r.MultipartForm.Value["config"]; configs != nil {
			for _, config := range configs {
				cfg := fileConfig{}
				err := json.Unmarshal([]byte(config), &cfg)
				if err != nil {
					return nil, 0, err
				}
				configMap[cfg.Name] = cfg
			}
		}
		if fhs := r.MultipartForm.File; fhs != nil {
			for _, files := range fhs {
				for _, file := range files {
					// save file config in db
					if _, ok := configMap[file.Filename]; ok {
						_cfg := configMap[file.Filename]
						err := SaveFileConfig(auth, host, _cfg)
						if err != nil {
							return nil, 0, err
						}
					}
					file.Filename = strings.ReplaceAll(file.Filename, "../", "")
					file.Filename = strings.ReplaceAll(file.Filename, "..\\", "")

					n0, err0 := SaveFormFile(file, filepath.Join(destDirectory, file.Filename))
					if err0 != nil {
						return nil, 0, err0
					}
					n += n0

					uploaded = append(uploaded, file)
				}
			}
			return uploaded, n, nil
		}
	}
	return nil, 0, http.ErrMissingFile
}

func SaveFileConfig(auth *auth.AuthData, host string, config fileConfig) error {
	File := &db.File{}
	result := db.CtxDB.Where("name = ?", config.Name).First(File)
	if result.Error != nil && result.Error != gorm.ErrRecordNotFound {
		return ecode.WithErrorMessage(ecode.ErrInternalDatabase, result.Error)
	}
	if result.RowsAffected == 0 {
		File = &db.File{
			Name:       config.Name,
			WithHeader: config.WithHeader,
			Delimiter:  config.Delimiter,
			Host:       host,
			Username:   auth.Username,
		}
		result := db.CtxDB.Create(File)
		if result.Error != nil {
			return ecode.WithErrorMessage(ecode.ErrInternalDatabase, result.Error)
		}
	} else {
		result = db.CtxDB.Model(&db.File{}).Where("name = ?", config.Name).Updates(map[string]interface{}{"with_header": config.WithHeader, "delimiter": config.Delimiter, "host": host})
		if result.Error != nil {
			return ecode.WithErrorMessage(ecode.ErrInternalDatabase, result.Error)
		}
	}

	return nil
}

func SaveFormFile(fh *multipart.FileHeader, dest string) (int64, error) {
	src, err := fh.Open()
	if err != nil {
		return 0, err
	}
	defer src.Close()

	out, err := os.Create(dest)
	if err != nil {
		return 0, err
	}
	defer out.Close()

	return io.Copy(out, src)
}

func checkCharset(file *multipart.FileHeader) (string, error) {
	f, err := file.Open()
	if err != nil {
		return "", err
	}
	defer f.Close()
	bytes := make([]byte, 1024)
	if _, err = f.Read(bytes); err != nil {
		return "", err
	}
	detector := chardet.NewTextDetector()
	best, err := detector.DetectBest(bytes)
	if err != nil {
		return "", err
	}
	return best.Charset, nil
}

func changeFileCharset2UTF8(filePath string, charSet string) error {
	fileUTF8Path := filePath + "-copy"
	err := func() error {
		file, err := os.OpenFile(filePath, os.O_RDONLY, 0o666)
		if err != nil {
			zap.L().Warn("open file fail", zap.Error(err))
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "upload failed")
		}
		defer file.Close()
		reader := bufio.NewReader(file)
		decoder := mahonia.NewDecoder(charSet)
		// this charset can not be changed
		if decoder == nil {
			return errNoCharset
		}
		decodeReader := decoder.NewReader(reader)
		fileUTF8, err := os.OpenFile(fileUTF8Path, os.O_RDONLY|os.O_CREATE|os.O_WRONLY, 0o666)
		if err != nil {
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "upload failed")
		}
		defer fileUTF8.Close()
		writer := bufio.NewWriter(fileUTF8)
		if _, err = writer.ReadFrom(decodeReader); err != nil {
			return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "upload failed")
		}
		return nil
	}()
	if err != nil {
		_, statErr := os.Stat(fileUTF8Path)
		if statErr == nil || os.IsExist(statErr) {
			removeErr := os.Remove(fileUTF8Path)
			if removeErr != nil {
				zap.L().Warn(fmt.Sprintf("remove file %s fail", fileUTF8Path), zap.Error(removeErr))
			}
		}
		if err == errNoCharset {
			return nil
		}
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "upload failed")
	}
	if err = os.Rename(fileUTF8Path, filePath); err != nil {
		return ecode.WithErrorMessage(ecode.ErrInternalServer, err, "upload failed")
	}
	return nil
}
