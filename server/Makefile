all: check build

check: fmt vet

build:
	go build -o server main.go

run:
	go run main.go

fmt:
	go fmt ./...

vet:
	go vet ./...

test:
	go test ./...
