package file

import (
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type FileDestroyLogic struct {
	logx.Logger
	r      *http.Request
	svcCtx *svc.ServiceContext
}

func NewFileDestroyLogic(r *http.Request, svcCtx *svc.ServiceContext) *FileDestroyLogic {
	return &FileDestroyLogic{
		Logger: logx.WithContext(r.Context()),
		r:      r,
		svcCtx: svcCtx,
	}
}

func (l *FileDestroyLogic) FileDestroy(req types.FileDestroyRequest) error {
	return service.NewFileService(l.r, l.r.Context(), l.svcCtx).FileDestroy(req.Name)
}
