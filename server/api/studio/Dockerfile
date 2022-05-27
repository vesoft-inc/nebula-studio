FROM golang:alpine AS builder

LABEL stage=gobuilder

ENV CGO_ENABLED 0
ENV GOOS linux
ENV GOPROXY https://goproxy.cn,direct

WORKDIR /build/zero

ADD go.mod .
ADD go.sum .
COPY pkg pkg
COPY pkgbuz pkgbuz
COPY api api
COPY rpc rpc
RUN go mod download

COPY ./api/studio/etc /app/etc
RUN go build -ldflags="-s -w" -o /app/studio ./api/studio/studio.go

FROM alpine

RUN apk update --no-cache && apk add --no-cache ca-certificates tzdata
ENV TZ Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/studio /app/studio
COPY --from=builder /app/etc /app/etc

EXPOSE 8888

CMD ["./studio", "-f", "etc/studio-api.yaml"]
