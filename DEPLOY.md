# Nebula Graph Studio Tar Package Deploy Guide

## Environment
- Node.js (>= 10.12.0)
- Linux

## Download
` wget https://oss-cdn.nebula-graph.com.cn/nebula-graph-studio/nebula-graph-studio-${version-release}.x86_64.tar.gz`

## Unpress
`tar -xvf nebula-graph-studio-${version-release}.x86_64.tar.gz`


## Directory descrption
Three packages in nebula-graph-studio 
- nebula-graph-studio ------------------------- FE service
- nebula-importer ----------------------------- Data Import Service
- nebula-http-gateway ----------------------- Network Service


## Quick Start

1. Nebula-importer
- packages： `nebula-importer`
- location：in the same machine with nebula-graph-studio
- Start：
  ```bash
  $ cd nebula-importer
  $ ./nebula-importer --port 5699 --callback "http://0.0.0.0:7001/api/import/finish" &
  ```
  Service address: http://127.0.0.1:5699

2. Nebula-http-gateway
- packages: `nebula-http-gateway`
- location：in the same machine with nebula-graph-studio
- Start：
  ```bash
  $ cd nebula-http-gateway
  $ nohup ./nebula-httpd &
  ```
- Service address: http://127.0.0.1:8080

3. nebula-graph-studio
- packages: `nebula-graph-studio`

- Start:
  ```bash
  $ cd nebula-graph-studio
  $ npm run start
  ```
- service address: http://127.0.0.1:7001

1. Open Nebula Graph Studio in browser
url: http://{{ip}}:7001


## Stop Service
Using `kill pid` ：

```bash
$ kill $(lsof -t -i :5699) # stop nebula-importer
$ kill $(lsof -t -i :8080) # stop nebula-http-gateway
$ cd nebula-graph-studio
$ npm run stop # stop nebula-graph-studio
```


