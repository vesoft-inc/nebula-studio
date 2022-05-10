package file

import (
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/zeromicro/go-zero/core/logx"
)

type FileUploadLogic struct {
	logx.Logger
	r      *http.Request
	svcCtx *svc.ServiceContext
}

func NewFileUploadLogic(r *http.Request, svcCtx *svc.ServiceContext) *FileUploadLogic {
	return &FileUploadLogic{
		Logger: logx.WithContext(r.Context()),
		r:      r,
		svcCtx: svcCtx,
	}
}

func (l *FileUploadLogic) FileUpload() error {
	return service.NewFileService(l.r, l.r.Context(), l.svcCtx).FileUpload()
}
