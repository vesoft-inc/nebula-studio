package pdf

import (
	"os"
	"testing"
)

// 165433TDR3045Z--冠能魅影DM630-D--平台说明书.pdf
func TestReader(t *testing.T) {
	file, err := os.Open("165433TDR3045Z--冠能魅影DM630-D--平台说明书.pdf")
	if err != nil {
		t.Fatal(err)
	}
	defer file.Close()

	// Use file as an io.ReadSeeker
	if err != nil {
		t.Fatal(err)
	}

}
