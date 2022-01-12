FROM node:12-alpine as nodebuilder
LABEL stage=nodebuilder
# Set the working directory to /app
WORKDIR /web
# Copy the current directory contents into the container at /web
COPY package.json /web/
COPY .npmrc /web/

# Install any needed packages
RUN npm install
COPY . /web/

# build and remove front source code
ENV NODE_OPTIONS=--max_old_space_size=2048
RUN npm run build

FROM golang:alpine AS gobuilder

LABEL stage=gobuilder

ENV CGO_ENABLED 1
ENV GOOS linux
ENV GOPROXY https://goproxy.cn,direct

WORKDIR /server

COPY server .
COPY --from=nodebuilder /web/dist /server/assets/
RUN go mod download
RUN apk add build-base
RUN go build -ldflags="-s -w" -o /server/server /server/main.go

FROM alpine

RUN apk update --no-cache && apk add --no-cache ca-certificates tzdata
ENV TZ Asia/Shanghai

WORKDIR /app
COPY --from=gobuilder /server/server /app/server
COPY --from=gobuilder /server/config /app/config/

EXPOSE 7001

CMD ["./server"]
