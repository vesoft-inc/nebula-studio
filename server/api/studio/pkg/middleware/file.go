package utils

import (
	"html/template"
	"io/fs"
	"net/http"
	"path/filepath"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/utils"
)

func AssetsMiddlewareWithCtx(svcCtx *svc.ServiceContext, embedAssets fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if filepath.Ext(r.URL.Path) == "" {
			tpl, err := template.ParseFS(embedAssets, "assets/index.html")
			withErrorMessage := utils.ErrMsgWithLogger(r.Context())
			if err != nil {
				svcCtx.ResponseHandler.Handle(w, r, nil, withErrorMessage(ecode.ErrInternalServer, err))
				return
			}

			w.Header().Set("Content-Type", "text/html")
			w.WriteHeader(http.StatusOK)
			tpl.Execute(w, map[string]any{"maxBytes": svcCtx.Config.MaxBytes})
			return
		}

		handler := middleware.NewAssetsHandler(middleware.AssetsConfig{
			Root:       "assets",
			Filesystem: http.FS(embedAssets),
			SPA:        true,
		})
		// if strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") && !strings.Contains(r.Header.Get("Accept"), "image/") {
		// 	w.Header().Set("Content-Encoding", "gzip")
		// }
		handler.ServeHTTP(w, r)
	})
}
