package file

import (
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/service"
	"net/http"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/svc"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type FilesIndexLogic struct {
	logx.Logger
	r      *http.Request
	svcCtx *svc.ServiceContext
}

func NewFilesIndexLogic(r *http.Request, svcCtx *svc.ServiceContext) *FilesIndexLogic {
	return &FilesIndexLogic{
		Logger: logx.WithContext(r.Context()),
		r:      r,
		svcCtx: svcCtx,
	}
}

func (l *FilesIndexLogic) FilesIndex() (resp *types.FilesIndexData, err error) {
	return service.NewFileService(l.r, l.r.Context(), l.svcCtx).FilesIndex()
}
