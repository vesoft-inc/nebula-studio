export GO111MODULE := on
GOOS := $(if $(GOOS),$(GOOS),linux)
GOARCH := $(if $(GOARCH),$(GOARCH),amd64)
GOENV  := GO15VENDOREXPERIMENT="1" CGO_ENABLED=0 GOOS=$(GOOS) GOARCH=$(GOARCH)
GO     := $(GOENV) go
GO_BUILD := $(GO) build -trimpath
# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

all: check

go-generate: $(GOBIN)/mockgen
	go generate ./...

check: tidy fmt vet imports lint

tidy:
	go mod tidy

fmt: $(GOBIN)/gofumpt
	# go fmt ./...
	$(GOBIN)/gofumpt -w -l ./

vet:
	go vet ./...

imports: $(GOBIN)/goimports $(GOBIN)/impi
	$(GOBIN)/impi --local github.com/vesoft-inc --scheme stdLocalThirdParty \
	    --skip handler/*.go --skip model/*.go --skip auth/* \
	    -ignore-generated ./... \
	    || exit 1

lint: $(GOBIN)/golangci-lint
	$(GOBIN)/golangci-lint run

tools: $(GOBIN)/goimports \
	$(GOBIN)/impi \
	$(GOBIN)/gofumpt \
	$(GOBIN)/golangci-lint \
	$(GOBIN)/controller-gen \
	$(GOBIN)/mockgen

$(GOBIN)/goimports:
	go install golang.org/x/tools/cmd/goimports@v0.1.12

$(GOBIN)/impi:
	go install github.com/pavius/impi/cmd/impi@v0.0.3

$(GOBIN)/gofumpt:
	go install mvdan.cc/gofumpt@v0.3.1

$(GOBIN)/golangci-lint:
	@[ -f $(GOBIN)/golangci-lint ] || { \
	set -e ;\
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(GOBIN) v1.6.3 ;\
	}

$(GOBIN)/mockgen:
	go install github.com/golang/mock/mockgen@v1.6.0
