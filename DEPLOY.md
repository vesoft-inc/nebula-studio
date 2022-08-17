# NebulaGraph Studio Tar Package Deploy Guide

## Environment
- Linux

## Download
`wget https://oss-cdn.nebula-graph.com.cn/nebula-graph-studio/nebula-graph-studio-${version}.x86_64.tar.gz`

## Unpress
`tar -xvf nebula-graph-studio-${version}.x86_64.tar.gz`

## Quick Start
1. Start Service
```bash
nohup ./server
```
- Service address: http://127.0.0.1:7001

You can modify the port in studio-api.yaml in the config directory

2. Open NebulaGraph Studio in browser
url: http://{{ip}}:7001


## Stop Service
Using `kill pid` ：

```bash
$ kill $(lsof -t -i :7001) 
```


