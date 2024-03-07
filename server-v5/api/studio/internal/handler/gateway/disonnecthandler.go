package gateway

import (
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/logic/gateway"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func DisonnectHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := gateway.NewDisonnectLogic(r.Context(), svcCtx)
		resp, err := l.Disonnect()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
