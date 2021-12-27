package controller

import (
	"encoding/csv"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"

	"github.com/vesoft-inc/nebula-studio/server/pkg/config"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/base"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"
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
	_, err := os.Stat(target)
	if err != nil {
		zap.L().Warn("del file error", zap.Error(err))
		return base.Response{
			Code:    base.Error,
			Message: err.Error(),
		}
	}
	// if target is directory, it is not empty.
	err = os.Remove(target)
	if err != nil {
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
	fmt.Println(len(files))
	ctx.StatusCode(http.StatusOK)
	return base.Response{
		Code: base.Success,
	}

}
