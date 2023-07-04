package batch_ngql

import (
	"time"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/client"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/utils"
	"github.com/zeromicro/go-zero/core/logx"
)

func Middleware(next utils.TNext) utils.TNext {
	return func(msgReceived *utils.MessageReceive, c *utils.Client) *utils.MessagePost {
		if next == nil || msgReceived == nil {
			return nil
		} else if msgReceived.Body.MsgType != "batch_ngql" {
			return next(msgReceived, c)
		}

		msgPost := utils.MessagePost{
			Header: utils.MessagePostHeader{
				MsgId:    msgReceived.Header.MsgId,
				SendTime: time.Now().UnixMilli(),
			},
			Body: utils.MessagePostBody{
				MsgType: msgReceived.Body.MsgType,
			},
		}

		gqls := []string{}
		space, _ := msgReceived.Body.Content["space"].(string)

		resContentData := make([]map[string]any, 0)

		if reqGqls, ok := msgReceived.Body.Content["gqls"].([]any); ok {
			for _, s := range reqGqls {
				if gql, ok := s.(string); ok {
					gqls = append(gqls, gql)
				}
			}
		}
		executes, err := client.Execute(c.ClientInfo.NSID, space, gqls)
		if err != nil {
			logx.Errorf("[WebSocket runNgql]: msgReceived.Body.Content(%v); error(%v)", &msgReceived.Body.Content, err)
			content := map[string]any{
				"code":    base.Error,
				"message": err.Error(),
			}
			if auth.IsSessionError(err) {
				content["code"] = ecode.ErrSession.GetCode()
			}
			msgPost.Body.Content = &content
			return &msgPost
		}

		for _, execute := range executes {
			gqlRes := map[string]any{"gql": execute.Gql, "data": execute.Result, "error": execute.Error}
			if execute.Error != nil {
				err = execute.Error
				gqlRes["message"] = err.Error()
				gqlRes["code"] = base.Error
				if auth.IsSessionError(err) {
					gqlRes["code"] = ecode.ErrSession.GetCode()
				}
			} else {
				gqlRes["code"] = base.Success
			}
			resContentData = append(resContentData, gqlRes)
		}
		msgPost.Body.Content = map[string]any{
			"code":    base.Success,
			"data":    resContentData,
			"message": "Success",
		}

		return &msgPost
	}
}
