package logger

import (
	"fmt"
	"time"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/pkg/ws/utils"
)

func Middleware(next utils.TNext) utils.TNext {
	return func(msgReceived *utils.MessageReceive, c *utils.Client) *utils.MessagePost {
		if next == nil || msgReceived == nil {
			return nil
		}

		startTime := time.Now()
		msgId := msgReceived.Header.MsgId
		fmt.Printf("===== middleware in, message id: %s, message type: %s =====\n", msgId, msgReceived.Body.MsgType)
		msg := next(msgReceived, c)
		fmt.Printf("===== middleware out, message id: %s, time spent: %dms =====\n", msgId, time.Since(startTime).Milliseconds())
		return msg
	}
}
