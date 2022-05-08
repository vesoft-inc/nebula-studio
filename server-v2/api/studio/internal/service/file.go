package service

import (
	"bufio"
	"context"
	"encoding/csv"
	"errors"
	"fmt"
	"github.com/axgle/mahonia"
	"github.com/saintfish/chardet"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/zeromicro/go-zero/core/logx"
	"go.uber.org/zap"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	defaultMulipartMemory = 500 << 20 // 500 MB
)

var (
	noCharsetErr             = errors.New("this charset can not be changed")
	_            FileService = (*fileService)(nil)
)

type (
	FileService interface {
		FileUpload() error
		FileDestroy(string) error
		FilesIndex() (*types.FilesIndexData, error)
	}

	fileService struct {
		logx.Logger
		ctx    context.Context
		svcCtx *svc.ServiceContext
		r      *http.Request
	}
)

func NewFileService(r *http.Request, ctx context.Context, svcCtx *svc.ServiceContext) FileService {
	if r != nil {
		return &fileService{
			Logger: logx.WithContext(r.Context()),
			r:      r,
			svcCtx: svcCtx,
		}
	} else {
		return &fileService{
			Logger: logx.WithContext(ctx),
			ctx:    ctx,
			svcCtx: svcCtx,
		}
	}
}

func (f *fileService) FileDestroy(name string) error {
	dir := f.svcCtx.Config.File.UploadDir
	target := filepath.Join(dir, name)
	if _, err := os.Stat(target); err != nil {
		logx.Infof("del file error %v", err)
		return err
	}

	//	if target is directory, it is not empty
	if err := os.Remove(target); err != nil {
		logx.Infof("del file error %v", err)
		return err
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
		path := filepath.Join(dir, fileInfo.Name())
		file, err := os.Open(path)
		if err != nil {
			logx.Infof("open files error %v", err)
			continue
		}
		reader := csv.NewReader(file)
		count := 0
		content := make([][]string, 0)
		for count < 3 {
			line, err := reader.Read()
			count++
			if err != nil {
				break
			}
			content = append(content, line)
		}
		data.List = append(data.List, types.FileStat{
			Content:    content,
			DataType:   "all",
			WithHeader: false,
			Name:       fileInfo.Name(),
			Size:       fileInfo.Size(),
		})
	}
	return data, nil
}

func (f *fileService) FileUpload() error {
	dir := f.svcCtx.Config.File.UploadDir
	_, err := os.Stat(dir)
	if err != nil {
		if os.IsNotExist(err) {
			os.MkdirAll(dir, os.ModePerm)
		} else {
			return err
		}
	}

	logx.Infof("dir:", dir)
	files, _, err := f.UploadFormFiles(dir)
	if err != nil {
		logx.Infof("upload file error:%v", err)
		return err
	}
	for _, file := range files {
		charSet, err := checkCharset(file)
		if err != nil {
			logx.Infof("upload file error, check charset fail:%v", err)
			return err
		}
		if charSet == "UTF-8" {
			continue
		}
		path := filepath.Join(dir, file.Filename)
		if err = changeFileCharset2UTF8(path, charSet); err != nil {
			logx.Infof("upload file error:%v", err)
			return err
		}
	}
	logx.Infof("upload %d files", len(files))
	return nil
}

func (f *fileService) UploadFormFiles(destDirectory string) (uploaded []*multipart.FileHeader, n int64, err error) {
	err = f.r.ParseMultipartForm(defaultMulipartMemory)
	if err != nil {
		return nil, 0, err
	}

	if f.r.MultipartForm != nil {
		if fhs := f.r.MultipartForm.File; fhs != nil {
			for _, files := range fhs {
				for _, file := range files {
					file.Filename = strings.ReplaceAll(file.Filename, "../", "")
					file.Filename = strings.ReplaceAll(file.Filename, "..\\", "")

					n0, err0 := f.SaveFormFile(file, filepath.Join(destDirectory, file.Filename))
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

func (f *fileService) SaveFormFile(fh *multipart.FileHeader, dest string) (int64, error) {
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
		file, err := os.OpenFile(filePath, os.O_RDONLY, 0666)
		if err != nil {
			zap.L().Warn("open file fail", zap.Error(err))
			return err
		}
		defer file.Close()
		reader := bufio.NewReader(file)
		decoder := mahonia.NewDecoder(charSet)
		// this charset can not be changed
		if decoder == nil {
			return noCharsetErr
		}
		decodeReader := decoder.NewReader(reader)
		fileUTF8, err := os.OpenFile(fileUTF8Path, os.O_RDONLY|os.O_CREATE|os.O_WRONLY, 0666)
		if err != nil {
			return err
		}
		defer fileUTF8.Close()
		writer := bufio.NewWriter(fileUTF8)
		if _, err = writer.ReadFrom(decodeReader); err != nil {
			return err
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
		if err == noCharsetErr {
			return nil
		}
		return err
	}
	if err = os.Rename(fileUTF8Path, filePath); err != nil {
		return err
	}
	return nil
}
