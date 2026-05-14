package service

import (
	"testing"

	"github.com/vesoft-inc/nebula-studio/server/api/studio/internal/types"
)

func TestBuildVIDExprByIndices(t *testing.T) {
	fields := []string{"1001", "tom"}

	intVID, err := buildVIDExprByIndices(fields, []int{0}, "", "", "", false)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if intVID != "1001" {
		t.Fatalf("unexpected int vid expr: %s", intVID)
	}

	stringVID, err := buildVIDExprByIndices(fields, []int{1}, "u_", "", "", true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if stringVID != `"u_tom"` {
		t.Fatalf("unexpected string vid expr: %s", stringVID)
	}
}

func TestBuildVIDExprByNodeID(t *testing.T) {
	fields := []string{"alice", "dev"}
	id := types.NodeId{
		ConcatItems: []interface{}{"user:", float64(0), "#", float64(1)},
	}
	vid, err := buildVIDExprByNodeID(fields, id, true)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if vid != `"user:alice#dev"` {
		t.Fatalf("unexpected vid expr: %s", vid)
	}
}

func TestBuildEdgeTuple(t *testing.T) {
	fields := []string{"1001", "1002", "8"}
	rankIdx := 2
	tuple := buildEdgeTuple("1001", "1002", &rankIdx, fields)
	if tuple != "1001->1002@8" {
		t.Fatalf("unexpected tuple: %s", tuple)
	}
}
