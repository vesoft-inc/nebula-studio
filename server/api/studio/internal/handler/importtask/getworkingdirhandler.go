// Code generated by goctl. DO NOT EDIT.
package importtask

import (
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/logic/importtask"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
)

func GetWorkingDirHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := importtask.NewGetWorkingDirLogic(r.Context(), svcCtx)
		data, err := l.GetWorkingDir()
		svcCtx.ResponseHandler.Handle(w, r, data, err)
	}
}
