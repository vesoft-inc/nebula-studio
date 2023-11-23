package llm

import (
	"regexp"
	"strconv"
	"testing"

	db "github.com/vesoft-inc/nebula-studio/server/api/studio/internal/model"
)

func TestImportJob_ReadPDFFile(t *testing.T) {
	// Create a mock ImportJob instance
	job := &ImportJob{
		LLMJob: &db.LLMJob{
			File: "data/llm/test.pdf",
		},
		Process: &db.Process{},
	}

	// Call the ReadPDFFile method
	result, err := job.ReadFile(job.LLMJob.File)
	// Check if there was an error
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}
	//print pdf content
	t.Log(result)
}

func TestTypeLength(t *testing.T) {
	regex := regexp.MustCompile(`\((\d+)\)`)
	match := regex.FindStringSubmatch("FIXED_STRING(32)")
	if len(match) > 1 {
		t.Log(match[1])
	}
	len, err := strconv.Atoi(match[1])
	if err != nil {
		t.Log(err)
	}
	t.Log(len)
}
