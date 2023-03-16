package filestore

import (
	"bufio"
	"errors"
	"fmt"
	"os/user"
	"strings"

	"github.com/pkg/sftp"
	"golang.org/x/crypto/ssh"
)

type SftpStore struct {
	Host       string
	Port       int
	Username   string
	Password   string
	SftpClient *sftp.Client
}

func NewSftpStore(host string, port int, username string, password string) (*SftpStore, error) {
	config := &ssh.ClientConfig{
		User: username,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	addr := fmt.Sprintf("%s:%d", host, port)
	conn, err := ssh.Dial("tcp", addr, config)
	if err != nil {
		return nil, err
	}

	client, err := sftp.NewClient(conn)
	if err != nil {
		return nil, err
	}

	return &SftpStore{
		Host:       host,
		Port:       port,
		Username:   username,
		Password:   password,
		SftpClient: client,
	}, nil
}

func (s *SftpStore) ReadFile(path string, startLine ...int) ([]string, error) {
	var numLines int
	var start int
	if len(startLine) == 0 {
		start = 0
		numLines = -1
	} else if len(startLine) == 1 {
		start = startLine[0]
		numLines = -1
	} else {
		start = startLine[0]
		numLines = startLine[1]
	}

	f, err := s.SftpClient.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	fileScanner := bufio.NewScanner(f)

	var lines []string
	for i := 0; i < start; i++ {
		if !fileScanner.Scan() {
			return nil, errors.New("start line is beyond end of file")
		}
	}

	for i := 0; numLines < 0 || i < numLines; i++ {
		if !fileScanner.Scan() {
			break
		}
		lines = append(lines, fileScanner.Text())
	}

	if err := fileScanner.Err(); err != nil {
		return nil, err
	}

	return lines, nil
}

func (s *SftpStore) ListFiles(dir string) ([]FileConfig, error) {
	var files []FileConfig
	if dir == "" {
		user, err := user.Lookup(s.Username)
		if err != nil {
			return nil, err
		}
		dir = user.HomeDir
	}

	_files, err := s.SftpClient.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	for _, file := range _files {
		isDir := file.IsDir()
		name := file.Name()
		var fileType string
		if isDir {
			fileType = "directory"
		} else if strings.HasSuffix(name, ".csv") {
			fileType = "csv"
		}
		if fileType != "" {
			files = append(files, FileConfig{
				Name: name,
				Size: file.Size(),
				Type: fileType,
			})
		}

	}
	return files, nil
}
