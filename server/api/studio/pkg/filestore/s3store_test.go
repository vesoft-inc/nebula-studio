package filestore

import (
	"errors"
	"io/ioutil"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3iface"
	"github.com/stretchr/testify/assert"
)

// A mock implementation of the s3.S3 interface for testing purposes
type mockS3Client struct {
	s3iface.S3API
	body       string
	statusCode int
}

func (m *mockS3Client) GetObject(input *s3.GetObjectInput) (*s3.GetObjectOutput, error) {
	output := &s3.GetObjectOutput{
		Body: ioutil.NopCloser(strings.NewReader(m.body)),
	}
	return output, nil
}

func (m *mockS3Client) ListObjects(input *s3.ListObjectsInput) (*s3.ListObjectsOutput, error) {
	// Define the mock S3 response
	s3Response := &s3.ListObjectsOutput{
		Contents: []*s3.Object{
			{Key: aws.String("path/to/file1.txt")},
			{Key: aws.String("path/to/file2.txt")},
			{Key: aws.String("path/to/subdir/")},
		},
	}

	return s3Response, nil
}

func TestS3Store_ReadFile(t *testing.T) {
	type args struct {
		path      string
		startLine []int
	}
	tests := []struct {
		name       string
		args       args
		body       string
		statusCode int
		want       []string
		wantErr    error
	}{
		{
			name: "Read entire file",
			args: args{
				path: "path/to/file.txt",
			},
			body:    "line 1\nline 2\nline 3\n",
			want:    []string{"line 1", "line 2", "line 3"},
			wantErr: nil,
		},
		{
			name: "Read first two lines",
			args: args{
				path:      "path/to/file.txt",
				startLine: []int{1, 2},
			},
			body:    "line 1\nline 2\nline 3\n",
			want:    []string{"line 2", "line 3"},
			wantErr: nil,
		},
		{
			name: "Read beyond end of file",
			args: args{
				path:      "path/to/file.txt",
				startLine: []int{4},
			},
			body:    "line 1\nline 2\nline 3\n",
			want:    nil,
			wantErr: errors.New("start line is beyond end of file"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a new S3Store instance
			s3Client := &mockS3Client{body: tt.body, statusCode: tt.statusCode}
			store := &S3Store{Bucket: "test-bucket", S3Client: s3Client}

			// Call the ReadFile method and check the result
			got, err := store.ReadFile(tt.args.path, tt.args.startLine...)
			assert.Equal(t, tt.wantErr, err)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestS3Store_ListFiles(t *testing.T) {
	// Create a new S3Store instance
	s3Client := &mockS3Client{}
	store := &S3Store{Bucket: "test-bucket", S3Client: s3Client}

	// Define the expected result
	expected := []string{"path/to/file1.txt", "path/to/file2.txt", "path/to/subdir/"}

	// Call the ListFiles method and check the result
	got, err := store.ListFiles("path/to/")
	assert.Nil(t, err)
	assert.Equal(t, expected, got)
}
