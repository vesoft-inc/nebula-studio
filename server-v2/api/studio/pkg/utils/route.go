package utils

import (
	"embed"
	"net/http"
	"path"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest"
)

var embedAssetsFolder = "assets"

func RegisterHandlers(engine *rest.Server, serverCtx *svc.ServiceContext, fs embed.FS) {
	dirlevel := []string{"/:1", ":2", ":3", ":4", ":5", ":6", ":7", ":8"}
	for i := 1; i < len(dirlevel); i++ {
		pathname := strings.Join(dirlevel[:i], "/")
		//最后生成 /asset
		engine.AddRoute(
			rest.Route{
				Method:  http.MethodGet,
				Path:    pathname,
				Handler: filehandler(fs),
			})
		logx.Infof("register route %s", pathname)
	}
}

func filehandler(fs embed.FS) http.HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) {
		fileType := filepath.Ext(req.URL.Path)
		// subpath default: index.html
		if len(fileType) == 0 {
			htmlFileData, _ := fs.ReadFile(path.Join(embedAssetsFolder, "index.html"))
			w.Write(htmlFileData)
			return
		}

		// assets file: a/b/c.(js|css|png)
		data, err := fs.ReadFile(path.Join(embedAssetsFolder, req.URL.Path))
		if err != nil {
			logx.Errorf("open resource error %s", err.Error())
			http.NotFound(w, req)
			return
		}

		// set assets response header
		w.Header().Set("Content-Type", GetMIME(fileType)+"; charset=utf-8")
		w.Header().Set("Content-Length", strconv.Itoa(len(data)))
		w.Header().Set("Cache-Control", "public, max-age=7200")

		w.Write(data)
	}
}
