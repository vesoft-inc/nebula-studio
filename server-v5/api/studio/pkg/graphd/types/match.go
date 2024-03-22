package types

type NodeParsed struct {
	Id         int64          `json:"id"`
	Type       string         `json:"type"`
	Labels     []string       `json:"labels"`
	Graph      string         `json:"graph"`
	Properties map[string]any `json:"properties"`
}

type EdgeParsed struct {
	Id         int64          `json:"id"`
	SrcId      int64          `json:"srcId"`
	DstId      int64          `json:"dstId"`
	Labels     []string       `json:"labels"`
	Properties map[string]any `json:"properties"`
	Rank       int64          `json:"rank"`
	Type       string         `json:"type"`
	IsDirected bool           `json:"isDirected"`
	Graph      string         `json:"graph"`
}

type ElementResult[T any] struct {
	Raw   string `json:"raw,omitempty"` // raw string of the element
	Type  string `json:"type"`          // type of the element: NODE/EDGE/PATH...
	Value T      `json:"value"`         // parsed value of the element
}
