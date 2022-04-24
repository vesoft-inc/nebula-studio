package controller

import (
	"bufio"
	"encoding/csv"
	"errors"
	"fmt"
	"io/ioutil"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/vesoft-inc/nebula-studio/server/pkg/config"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"

	"github.com/axgle/mahonia"
	"github.com/kataras/iris/v12"
	"github.com/saintfish/chardet"
	"go.uber.org/zap"
)

var (
	noCharsetErr = errors.New("this charset can not be changed")
)

type fileStat struct {
	Content    [][]string `json:"content"`
	Path       string     `json:"path"`
	WithHeader bool       `json:"withHeader"`
	DataType   string     `json:"dataType"`
	Name       string     `json:"name"`
	Size       int64      `json:"size"`
}

func FilesDestroy(ctx iris.Context) base.Result {
	id := ctx.Params().GetString("id")
	dir := config.Cfg.Web.UploadDir
	target := filepath.Join(dir, id)
	if _, err := os.Stat(target); err != nil {
		zap.L().Warn("del file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	// if target is directory, it is not empty.
	if err := os.Remove(target); err != nil {
		zap.L().Warn("del file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	return base.Response{
		Code: base.Success,
	}
}

func FilesIndex(ctx iris.Context) base.Result {
	dir := config.Cfg.Web.UploadDir
	filesInfo, err := ioutil.ReadDir(dir)
	if err != nil {
		zap.L().Warn("open files error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}

	data := make([]*fileStat, 0)
	for _, fileInfo := range filesInfo {
		if fileInfo.IsDir() {
			continue
		}
		path := filepath.Join(dir, fileInfo.Name())
		file, err := os.Open(path)
		if err != nil {
			zap.L().Warn("open files error", zap.Error(err))
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
		data = append(data, &fileStat{
			Content:    content,
			DataType:   "all",
			Path:       path,
			WithHeader: false,
			Name:       fileInfo.Name(),
			Size:       fileInfo.Size(),
		})
	}
	return base.Response{
		Code: base.Success,
		Data: data,
	}
}

func FilesUpload(ctx iris.Context) base.Result {
	dir := config.Cfg.Web.UploadDir
	files, _, err := ctx.UploadFormFiles(dir)
	if err != nil {
		zap.L().Warn("upload file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	for _, file := range files {
		charSet, err := checkCharset(file)
		if err != nil {
			zap.L().Warn("upload file error, check charset fail", zap.Error(err))
			return base.Response{
				Code:    base.Error,
				Message: err.Error(),
			}
		}
		if charSet == "UTF-8" {
			continue
		}
		path := filepath.Join(dir, file.Filename)
		if err = changeFileCharset2UTF8(path, charSet); err != nil {
			zap.L().Warn("upload file error", zap.Error(err))
			return base.Response{
				Code:    base.Error,
				Message: err.Error(),
			}
		}
	}
	zap.L().Info(fmt.Sprintf("upload %d files", len(files)))
	return base.Response{
		Code: base.Success,
	}
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
