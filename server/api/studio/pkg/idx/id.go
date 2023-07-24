//go:generate mockgen -package idx -destination id_mock.go -source id.go Generator
package idx

import (
	"sync"

	"github.com/rs/xid"
)

const (
	// idPrefix is used to avoid the first character may be a number.
	idPrefix = "n"
)

var (
	gGenerator     Generator = (*xidGenerator)(nil)
	gGeneratorInit sync.Once
)

type (
	Generator interface {
		Generate() string
	}

	xidGenerator struct{}
)

func New() Generator {
	return &xidGenerator{}
}

func Generate() string {
	gGeneratorInit.Do(func() {
		gGenerator = New()
	})
	return gGenerator.Generate()
}

func (*xidGenerator) Generate() string {
	return idPrefix + xid.New().String()
}
