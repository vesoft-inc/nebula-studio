package gateway

import (
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/logic/gateway"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func ExecGQLHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ExecGQLParams
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := gateway.NewExecGQLLogic(r.Context(), svcCtx)
		resp, err := l.ExecGQL(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
