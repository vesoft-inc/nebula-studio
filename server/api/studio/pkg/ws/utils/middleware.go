package utils

type TNext func(msg *MessageReceive, client *Client) *MessagePost

type TMiddleware func(next TNext) TNext
