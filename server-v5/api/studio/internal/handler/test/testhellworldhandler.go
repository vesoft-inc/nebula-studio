package test

import (
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/logic/test"
	"github.com/vesoft-inc/nebula-studio/server-v5/api/studio/internal/svc"
	"github.com/zeromicro/go-zero/rest/httpx"
)

func TestHellworldHandler(svcCtx *svc.ServiceContext) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l := test.NewTestHellworldLogic(r.Context(), svcCtx)
		resp, err := l.TestHellworld()
		if err != nil {
			httpx.ErrorCtx(r.Context(), w, err)
		} else {
			httpx.OkJsonCtx(r.Context(), w, resp)
		}
	}
}
