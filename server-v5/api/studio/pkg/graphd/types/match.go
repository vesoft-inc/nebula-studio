package types

type NodeParsed struct {
	VID        int64          `json:"vid"`
	Properties map[string]any `json:"properties"`
}

type EdgeParsed struct {
	VID        int64          `json:"vid"`
	Properties map[string]any `json:"properties"`
}

type ElementResult[T any] struct {
	Raw   string `json:"raw,omitempty"` // raw string of the element
	Type  string `json:"type"`          // type of the element: NODE/EDGE/PATH...
	Value T      `json:"value"`         // parsed value of the element
}
