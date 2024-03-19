package utils

import (
	"io/fs"
	"net/http"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
)

func AssetsMiddlewareWithCtx(svcCtx *svc.ServiceContext, embedAssets fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handler := middleware.NewAssetsHandler(middleware.AssetsConfig{
			Root:       "assets",
			Filesystem: http.FS(embedAssets),
			SPA:        true,
		})
		handler.ServeHTTP(w, r)
	})
}
