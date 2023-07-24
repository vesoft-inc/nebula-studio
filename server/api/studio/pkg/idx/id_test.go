package idx

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNew(t *testing.T) {
	ast := assert.New(t)

	idGenerator := New()
	ast.IsType(&xidGenerator{}, idGenerator)
	id := idGenerator.Generate()
	ast.NotEmpty(id)
	ast.Len(id, 21)
	ast.True(id == strings.ToLower(id))
	ast.True(strings.HasPrefix(id, idPrefix))
}

func TestGenerate(t *testing.T) {
	ast := assert.New(t)

	id := Generate()
	ast.NotEmpty(id)
	ast.Len(id, 21)
}
