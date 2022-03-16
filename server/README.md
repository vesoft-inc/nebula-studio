# nebula-studio-server

Go server to provide a http interface for the Nebula Studio

## Build

```
$ go build -o nebula-studio-server
```

## Run

```
$ ./nebula-studio-server -studio-config="./config/example-config.yaml"
```

## Required

- Go 1.15+
- [iris](https://www.iris-go.com/docs/#/?id=quick-start)

## User Guide

### API Definition

| Name               | Path                      | Method   |
| ------------------ | ------------------------- | -------- |
| ExecNGQL           | /api-nebula/db/exec | POST     |
| ConnectDB          | /api-nebula/db/connect | POST     |
| DisconnectDB       | /api-nebula/db/disconnect | POST     |
| ImportData         | /api/import-tasks/import | POST     |
| HandleImportAction | /api/import-tasks/action | POST     |
| QueryImportStats | /api/import-tasks/stats/{id:string} | GET |
| DownloadConfig | /api/import-tasks/config/{id:string} | GET    |
| DownloadImportLog | /api/import-tasks/{id:string}/log | GET |
| DownloadErrLog | /api/import-tasks/{id:string}/err-logs       | GET |
| ReadLog            | /api/import-tasks/logs                       | GET      |
| ReadErrLog | /api/import-tasks/err-logs                   | GET |
| Callback           | /api/import-tasks/finish                     | POST     |
| GetWorkingDir      | /api/import-tasks/working-dir                | GET      |
| GetTaskDir    | /api/import-tasks/task-dir                   | GET |
| GetTaskLogNames | /api/import-tasks/{id:string}/task-log-names | GET    |
| FilesIndex | /api/files | GET |
| FilesDestroy | /api/files/{id:string} | DELETE |
| FilesUpload | /api/files | PUT |

#### ExecNGQL API

The request json body:

```json
{gql: "", paramList: [":params"]}
```

Response:

```json
{
  "code": 0,
  "message": "",
  "data": {
    "headers": [],
    "tables": [],
    "timeCost": 0,
    "localParams": null
  }
}
```

#### ConnectDB  API

The request json body:

```json
{address: "192.168.8.243", port: 9669, username: "root", password: "123"}
```

Response:

```json
{
    "code": 0,
    "message": "",
    "data": {
        "nsid": "e870674d-6ebc-4d9d-a1f7-bf59fdca24e8",
        "version": "v2.6"
    }
}
```

#### DisconnectDB API

Response:

```json
{
  "code": 0,
  "message": "",
  "data": null
}
```

#### ImportData API

The request json body:

```json
{"configBody":{"version":"v2","description":"web console import","clientSettings":{"retry":3,"concurrency":10,"channelBufferSize":128,"space":"basketballplayer","connection":{"user":"root","password":"123","address":"192.168.8.145:9669"}},"logPath":"E:\\NebulaProject\\test\\nebula-studio\\server\\data\\tasks/import.log","files":[{"path":"E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload\\player.csv","failDataPath":"E:\\NebulaProject\\test\\nebula-studio\\server\\data\\tasks/err/data 1Fail.csv","batchSize":10,"type":"csv","csv":{"withHeader":false,"withLabel":false},"schema":{"type":"vertex","vertex":{"vid":{"index":0,"type":"string"},"tags":[{"name":"player","props":[{"name":"name","type":"string","index":1},{"name":"age","type":"int","index":2}]}]}}}]},"configPath":"","name":"task1"}
```

Response:

```json
{
  "code": 0,
  "message": "Import task 4 submit successfully",
  "data": [
    "4"
  ]
}
```

#### HandleImportAction API

The request json body:

```json
{"taskID":"1","taskAction":"actionQuery"}
```

Response:

```json
{
    "code": 0,
    "message": "Processing a task action successfully",
    "data": {
        "results": [
            {
                "taskID": 1,
                "name": "task1",
                "space": "test",
                "nebulaAddress": "192.168.8.243:9669",
                "createdTime": 1644386055,
                "updatedTime": 1644386056,
                "user": "root",
                "taskStatus": "statusAborted",
                "taskMessage": "failed to open connection, error: incompatible version between client and server: Graph client version(3.0.0) is not accepted, current graph client white list: 2.6.1:2.5.0:2.5.1:2.6.0. ",
             "stats": {
                "numFailed": 0,
                "numReadFailed": 0,
                "totalCount": 0,
                "totalBatches": 0,
                "totalLatency": 0,
                "totalReqTime": 0,
                "totalBytes": 0,
                "totalImportedBytes": 0
       			 }
            }
        ],
        "msg": "Task query successfully"
    }
}
```

#### QueryImportStats API

  /api/import-tasks/stats/3

Response:

```json
{
    "code": 0,
    "message": "Processing a task action successfully",
    "data": {
        "taskID": 3,
        "name": "task1",
        "space": "test",
        "nebulaAddress": "192.168.8.233:9669",
        "createdTime": 1646989643,
        "updatedTime": 1646989646,
        "user": "root",
        "taskStatus": "statusFinished",
        "taskMessage": "",
        "stats": {
            "numFailed": 0,
            "numReadFailed": 0,
            "totalCount": 52,
            "totalBatches": 10,
            "totalLatency": 30089,
            "totalReqTime": 532718,
            "totalBytes": 1583,
            "totalImportedBytes": 1583
        }
    }
}
```

#### DownloadConfig API

  /api/import-tasks/config/2

Response:

```
version: v2
description: web console import
removeTempFiles: null
clientSettings:
  retry: 3
  concurrency: 10
  channelBufferSize: 128
  space: test
  connection:
    user: ""
    password: ""
    address: ""
  postStart: null
  preStop: null
logPath: import.log
files:
- path: player.csv
  failDataPath: 数据源 1Fail.csv
  batchSize: 10
  limit: null
  inOrder: null
  type: csv
  csv:
    withHeader: false
    withLabel: false
    delimiter: null
  schema:
    type: vertex
    edge: null
    vertex:
      vid:
        index: 0
        function: null
        type: string
        prefix: null
      tags:
      - name: player
        props:
        - name: name
          type: string
          index: 1
        - name: age
          type: int
          index: 2

```

#### DownloadImportLog API

The request :

http://localhost:9000/api/import-tasks/1/log

Response：

a file

#### DownloadErrLog

The request :

http://localhost:9000/api/import-tasks/1/err-logs?name=1Fail.csv

Response：

a file

#### ReadLog API
Use params:
http://localhost:9000/api/import-tasks/logs?offset=0&limit=2&id=1
Response:

```json
{
    "code": 0,
    "message": "",
    "data": [
        "2022/03/16 15:23:00 [INFO] clientmgr.go:28: Create 10 Nebula Graph clients",
        "2022/03/16 15:23:00 [INFO] reader.go:65: Start to read file(0): E:\\NebulaProject\\player.csv, schema: < :VID(string),player.name:string,player.age:int >"
    ]
}
```
#### ReadErrLog API

Use params:

http://localhost:9000/api/import-tasks/err-logs?offset=0&limit=2&id=1&name=err-import.log

Response:

```json
{
    "code": 0,
    "message": "",
    "data": [
        "2022/03/16 15:23:00 [INFO] clientmgr.go:28: Create 10 Nebula Graph clients",
        "2022/03/16 15:23:00 [INFO] reader.go:65: Start to read file(0): E:\\NebulaProject\\player.csv, schema: < :VID(string),player.name:string,player.age:int >"
    ]
}
```

#### Callback API

The request json body:

```json
{
  "task_id": "123456"
}
```

Response:

```json
{
    "code": 0,
    "message": "",
    "data": ""
}
```

#### GetWorkingDir API

Response:

```json
{
    "code": 0,
    "message": "",
    "data": {
        "uploadDir": "E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload"
    }
}
```

#### GetTaskDir API

Response:

```json
{
    "code": 0,
    "message": "",
    "data": {
        "taskDir": "E:\\NebulaProject\\nebula-studio\\server\\data\\tasks\\1"
    }
}
```

#### GetTaskLogNames API

Request:

http://localhost:9000/api/import-tasks/1/task-log-names

Response:

```json
{
    "code": 0,
    "message": "",
    "data": [
        {
            "name": "import.log"
        {
            "name": "err 1.log"
        },
        {
            "name": "err 2.log"
        }
    ]
}
```

#### FilesIndex API

Response:

```json
{
  "code": 0,
  "message": "",
  "data": [
    {
      "content": [
        [
          "Nobody",
          "Nobody",
          "0"
        ],
        [
          "Amar'e Stoudemire",
          "Amar'e Stoudemire",
          "36"
        ],
        [
          "Russell Westbrook",
          "Russell Westbrook",
          "30"
        ]
      ],
      "path": "E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload\\player.csv",
      "withHeader": false,
      "dataType": "all",
      "name": "player.csv",
      "size": 1583
    }
  ]
}

```

#### FilesDestroy API

Response:

```json
{
    "code": 0,
    "message": "",
    "data": "null"
}
```

#### FilesUpload API

Request:

```http
Content-type:multipart/form-data
form-data:
key:file1 value:bachelor.csv
key:file2 value:like.csv
```

Response:

```json
{
    "code": 0,
    "message": "",
    "data": "null"
}
```

#### 