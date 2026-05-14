package datasource

import (
	"net/http"

	"github.com/vesoft-inc/go-pkg/validator"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/logic/datasource"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func DatasourceGrantAddHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.DatasourceGrantAddRequest
		if err := httpx.Parse(r, &req); err != nil {
			err = ecode.WithErrorMessage(ecode.ErrParam, err)
			svcCtx.ResponseHandler.Handle(w, r, nil, err)
			return
		}
		if err := validator.Struct(req); err != nil {
			svcCtx.ResponseHandler.Handle(w, r, nil, err)
			return
		}

		l := datasource.NewDatasourceGrantAddLogic(r.Context(), svcCtx)
		err := l.DatasourceGrantAdd(req)
		svcCtx.ResponseHandler.Handle(w, r, nil, err)
	}
}
