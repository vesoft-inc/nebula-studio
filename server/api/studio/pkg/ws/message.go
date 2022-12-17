package ws

type MessageReceiveHeader struct {
	MsgId   string `json:"msgId"`
	Version string `json:"version,omitempty"`
}

type MessageReceiveBody struct {
	Product string         `json:"product"`
	MsgType string         `json:"msgType"`
	Content map[string]any `json:"content,omitempty"`
}

type MessageReceive struct {
	Header MessageReceiveHeader `json:"header"`
	Body   MessageReceiveBody   `json:"body"`
}

type MessagePostHeader struct {
	MsgId    string `json:"msgId"`
	SendTime int64  `json:"sendTime,omitempty"`
}

type MessagePostBody struct {
	MsgType string `json:"msgType"`
	Content any    `json:"content"`
}

type MessagePost struct {
	Header MessagePostHeader `json:"header"`
	Body   MessagePostBody   `json:"body"`
}
