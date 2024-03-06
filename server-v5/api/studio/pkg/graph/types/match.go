package types

type NodeParsed struct {
	ID         int64          `json:"id"`
	Properties map[string]any `json:"properties"`
}

type EdgeParsed struct {
	ID         int64          `json:"id"`
	Properties map[string]any `json:"properties"`
}

type ElementResult[T any] struct {
	Raw   string `json:"raw,omitempty"` // raw string of the element
	Value T      `json:"value"`         // parsed value of the element
}
