package filestore

import (
	"github.com/agiledragon/gomonkey/v2"
	"reflect"
	"testing"

	"github.com/pkg/sftp"
)

func TestSftpStore_ReadFile(t *testing.T) {
	patches1 := gomonkey.ApplyFunc(NewSftpStore, func(host string, port int, username string, password string) (*SftpStore, error) {
		return &SftpStore{}, nil
	})
	defer patches1.Reset()

	s, err := NewSftpStore("localhost", 22, "testuser", "testpassword")
	mockClient := &sftp.Client{}
	s.SftpClient = mockClient

	patches2 := gomonkey.ApplyMethod(reflect.TypeOf(mockClient), "Open", func(_ string) (*sftp.File, error) {
		return &sftp.File{}, nil
	})
	defer patches2.Reset()

	// Read the contents of a test file
	lines, err := s.ReadFile("/path/to/test/file", 0)
	if err != nil {
		t.Fatal(err)
	}

	// Check that the contents of the file match what we expect
	expectedLines := []string{"line 1", "line 2", "line 3"}
	if !reflect.DeepEqual(lines, expectedLines) {
		t.Errorf("unexpected lines read from file: got %v, want %v", lines, expectedLines)
	}
}
