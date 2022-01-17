all: tidy check build

check: fmt vet

tidy:
	go mod tidy

build:
	go build -o nebula-studio-server main.go

run:
	go run main.go

fmt:
	go fmt ./...

vet:
	go vet ./...

test:
	go test ./...
