package utils

import (
	"io/fs"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/vesoft-inc/go-pkg/middleware"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/config"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/pkg/auth"
	"github.com/zeromicro/go-zero/core/logx"
)

func ValidateAuthCookie(r *http.Request, config *config.Config) (*auth.AuthData, error) {
	tokenCookie, err := r.Cookie(config.Auth.TokenName)
	if err != nil {
		return nil, err
	}
	authInfo, err := auth.Decode(tokenCookie.Value, config.Auth.TokenSecret)
	if err != nil {
		return nil, err
	}

	return authInfo, nil
}

func AssetsMiddlewareWithCtx(svcCtx *svc.ServiceContext, embedAssets fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logger := logx.WithContext(r.Context())

		if filepath.Ext(r.URL.Path) == "" && !strings.HasPrefix(r.URL.Path, "/login") {
			_, err := ValidateAuthCookie(r, &svcCtx.Config)
			urlSearch := r.URL.Query().Encode()
			if urlSearch != "" {
				urlSearch = "?" + urlSearch
			}
			redirectUrl := "/login" + urlSearch
			if err != nil {
				logger.Infof("login with error: %v, redirect to %s", err, redirectUrl)
				http.Redirect(w, r, redirectUrl, http.StatusFound)
				return
			}
		}

		handler := middleware.NewAssetsHandler(middleware.AssetsConfig{
			Root:       "assets",
			Filesystem: http.FS(embedAssets),
			SPA:        true,
		})
		handler.ServeHTTP(w, r)
	})
}
