// Code generated by goctl. DO NOT EDIT.
package file

import (
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/logic/file"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
)

func FilesIndexHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := file.NewFilesIndexLogic(r.Context(), svcCtx)
		data, err := l.FilesIndex()
		svcCtx.ResponseHandler.Handle(w, r, data, err)
	}
}
