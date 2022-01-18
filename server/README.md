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
| ExecNGQL           | /api-nebula/db/connect   | POST     |
| ConnectDB          | /api-nebula/db/exec       | POST     |
| DisconnectDB       | /api-nebula/db/disconnect | POST     |
| ImportData         | /api-nebula/task/import   | POST     |
| HandleImportAction | /api-nebula/import/action | POST     |
| FilesIndex         | /api/files                | GET      |
| FilesDestroy       | /api/files/{id:string}    | DELETE   |
| FilesUpload        | /api/files                | PUT      |
| ReadLog            | /api/import/log           | GET      |
| CreateConfigFile   | /api/import/config        | POST     |
| Callback           | /api/import/finish        | POST     |
| GetWorkingDir      | /api/import/working_dir   | GET      |
| Index              | /                         | GET,HEAD |

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
    "nsid": "ae50dc65-0ef4-48f3-8f55-6a562a7e2ed7"
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
{"configBody":{"version":"v2","description":"web console import","clientSettings":{"retry":3,"concurrency":10,"channelBufferSize":128,"space":"basketballplayer","connection":{"user":"root","password":"123","address":"192.168.8.145:9669"}},"logPath":"E:\\NebulaProject\\test\\nebula-studio\\server\\data\\tasks/import.log","files":[{"path":"E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload\\player.csv","failDataPath":"E:\\NebulaProject\\test\\nebula-studio\\server\\data\\tasks/err/data 1Fail.csv","batchSize":10,"type":"csv","csv":{"withHeader":false,"withLabel":false},"schema":{"type":"vertex","vertex":{"vid":{"index":0,"type":"string"},"tags":[{"name":"player","props":[{"name":"name","type":"string","index":1},{"name":"age","type":"int","index":2}]}]}}}]},"configPath":""}
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
{
  "code": 0,
  "message": "Import task 4 submit successfully",
  "data": [
    "4"
  ]
}
```

Response:

```json
{
  "code": 0,
  "message": "Processing a task action successfully",
  "data": {
    "results": [
      {
        "taskID": "4",
        "taskStatus": "statusFinished",
        "taskMessage": ""
      }
    ],
    "msg": "Task query successfully"
  }
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
#### ReadLog API
Use params:
http://localhost:7001/api/import/log?dir=E:\NebulaProject\test\nebula-studio\server\data\tasks&startByte=0&endByte=1000000&taskId=4
Response:

```json
{
  "code": 0,
  "message": "",
  "data": "2022/01/11 16:33:48 [INFO] clientmgr.go:28: Create 10 Nebula Graph clients\u003cbr /\u003e2022/01/11 16:33:48 [INFO] reader.go:64: Start to read file(0): E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload\\player.csv, schema: \u003c :VID(string),player.name:string,player.age:int \u003e\u003cbr /\u003e2022/01/11 16:33:48 [INFO] reader.go:180: Total lines of file(E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload\\player.csv) is: 52, error lines: 0\u003cbr /\u003e2022/01/11 16:33:48 [INFO] statsmgr.go:62: Done(E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload\\player.csv): Time(1.45s), Finished(52), Failed(0), Read Failed(0), Latency AVG(6182us), Batches Req AVG(48887us), Rows AVG(35.87/s)\u003cbr /\u003e"
}xxxxxxxxxx {  "code": 0,  "message": "",  "data": "2022/01/11 16:33:48 [INFO] clientmgr.go:28: Create 10 Nebula Graph clients\u003cbr /\u003e2022/01/11 16:33:48 [INFO] reader.go:64: Start to read file(0): E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload\\player.csv, schema: \u003c :VID(string),player.name:string,player.age:int \u003e\u003cbr /\u003e2022/01/11 16:33:48 [INFO] reader.go:180: Total lines of file(E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload\\player.csv) is: 52, error lines: 0\u003cbr /\u003e2022/01/11 16:33:48 [INFO] statsmgr.go:62: Done(E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload\\player.csv): Time(1.45s), Finished(52), Failed(0), Read Failed(0), Latency AVG(6182us), Batches Req AVG(48887us), Rows AVG(35.87/s)\u003cbr /\u003e"}{    "code": 0,    "message": "",    "data": "hell"}
```
#### CreateConfigFile API
Create a config file in config_dir
```json
{"config":{"version":"v2","description":"web console import","clientSettings":{"retry":3,"concurrency":10,"channelBufferSize":128,"space":"basketballplayer","connection":{"user":"root","password":"123","address":"192.168.8.145:9669"}},"logPath":"E:\\NebulaProject\\test\\nebula-studio\\server\\data\\tasks/import.log","files":[]},"mountPath":"E:\\NebulaProject\\test\\nebula-studio\\server\\data\\tasks"}
```

Response:

```json
{
    "code": 0,
    "message": "",
    "data": ""
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
        "taskDir": "E:\\NebulaProject\\test\\nebula-studio\\server\\data\\tasks",
        "uploadDir": "E:\\NebulaProject\\test\\nebula-studio\\server\\data\\upload"
    }
}
```

