package filestore

import (
	"encoding/json"
	"testing"
)

func TestS3Store(t *testing.T) {
	s3Config := map[string]string{
		"endpoint":     "s3.us-east-1.amazonaws.com",
		"region":       "us-east-1",
		"accessKeyID":  "",
		"accessSecret": "",
	}
	bytes, _ := json.Marshal(s3Config)
	store, err := NewFileStore("s3", string(bytes), s3Config["accessSecret"])
	if err != nil {
		t.Log("NewFileStore Error: ", err)
	}
	files, err := store.ListFiles("aws-cloudtrail-logs-782052981853-c71cab26")
	if err != nil {
		t.Log("ListFiles Error: ", err)
	}
	t.Log("ListFiles: ", files, len(files))

	lines, err := store.ReadFile("didi-pj/quickstart-vesoft-nebula-graph-cloud/scripts/analytics-install.sh", 0, 4)
	if err != nil {
		t.Log("ReadFile Error: ", err)
	}
	t.Log("ReadFile: ", lines, len(lines))

	s3Store, ok := store.(*S3Store)
	if !ok {
		t.Log("The store isn't a s3Store")
	}
	buckets, err := s3Store.ListBuckets()
	if err != nil {
		t.Log("ListBuckets Error: ", err)
	}
	t.Log("ListBuckets: ", buckets)
}
