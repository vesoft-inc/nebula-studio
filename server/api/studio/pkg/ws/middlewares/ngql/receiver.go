package ngql

import (
	"time"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/auth"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/base"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/client"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ecode"
	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/utils"
	"github.com/zeromicro/go-zero/core/logx"
)

// Receiver: next => (msg, client, hub) => {}
// without lambda expression, higher order function is quite ugly
func Middleware(next utils.TNext) utils.TNext {
	return func(msgReceived *utils.MessageReceive, c *utils.Client) *utils.MessagePost {
		if next == nil || msgReceived == nil {
			return nil
		} else if msgReceived.Body.MsgType != "ngql" {
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

		gqls := make([]string, 0)
		space, _ := msgReceived.Body.Content["space"].(string)
		if reqGql, ok := msgReceived.Body.Content["gql"].(string); ok {
			gqls = append(gqls, reqGql)
		}
		execute, err := client.Execute(c.ClientInfo.NSID, space, gqls)
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
		} else {
			res := execute[0]
			if res.Error != nil {
				err = res.Error
				content := map[string]any{
					"code":    base.Error,
					"message": err.Error(),
				}
				if auth.IsSessionError(err) {
					content["code"] = ecode.ErrSession.GetCode()
				}
				msgPost.Body.Content = &content
			} else {
				msgPost.Body.Content = map[string]any{
					"code":    base.Success,
					"data":    &execute[0].Result,
					"message": "Success",
				}
			}
		}
		// msgSend, err := json.Marshal(msgPost)

		return &msgPost
	}
}
