package gateway

import (
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/logic/gateway"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/types"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func ConnectHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req types.ConnectDBParams
		if err := httpx.Parse(r, &req); err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
			return
		}

		l := gateway.NewConnectLogic(r.Context(), svcCtx)
		err := l.Connect(&req)
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.Ok(w)
		}
	}
}
