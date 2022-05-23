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
	$(GOBIN)/mockgen \
	$(GOBIN)/goctl

$(GOBIN)/goimports:
	$(call go-get-tool,$(GOBIN)/goimports,golang.org/x/tools/cmd/goimports)

$(GOBIN)/impi:
	$(call go-get-tool,$(GOBIN)/impi,github.com/pavius/impi/cmd/impi)

$(GOBIN)/gofumpt:
	$(call go-get-tool,$(GOBIN)/gofumpt,mvdan.cc/gofumpt)

$(GOBIN)/golangci-lint:
	@[ -f $(GOBIN)/golangci-lint ] || { \
	set -e ;\
	curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(GOBIN) v1.42.0 ;\
	}

$(GOBIN)/mockgen:
	$(call go-get-tool,$(GOBIN)/mockgen,github.com/golang/mock/mockgen@v1.6.0)

$(GOBIN)/goctl:
	$(call go-get-tool,$(GOBIN)/goctl,github.com/zeromicro/go-zero/tools/goctl@v1.3.2)

$(GOBIN)/modelconst-gen:
	$(call go-get-tool,$(GOBIN)/modelconst-gen,github.com/vesoft-inc/nebula-studio/server-v2/tools/modelconst-gen)

# go-get-tool will 'go get' any package $2 and install it to $1.
define go-get-tool
@[ -f $(1) ] || { \
set -e ;\
TMP_DIR=$$(mktemp -d) ;\
cd $$TMP_DIR ;\
go mod init tmp ;\
echo "Downloading $(2)" ;\
go get $(2) ;\
rm -rf $$TMP_DIR ;\
}
endef