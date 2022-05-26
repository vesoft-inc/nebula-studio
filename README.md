# Nebula Graph Studio
Nebula Graph Studio (Studio for short) is a web-based visualization tool for Nebula Graph. With Studio, you can create a graph schema, import data and edit nGQL statements for data queries.
![](./introduction.png)

## Architecture
![](architecture.png)

## Development Quick Start

### set up studio and server at the same time
```
$ npm install
$ npm run dev-all
```

### Set up nebula-graph-studio only
```
$ npm install
$ npm run dev
```
### Set up go-server only
```
$ cd ./server/api/studio
$ make run
```

## Production Deploy

### 1. Build Web
```
$ npm install
$ npm run build
$ mv dist server/api/studio/assets
```

### 2. Build Server
```
$ cd server/api/studio
// update default port 9000 to 7001 in etc/studio-api.yaml first
$ go build -o server
```

### 3. Start
```
$ nohup ./server &
```

### 4. Stop Server
Use when you want shutdown the web app
```
kill -9 $(lsof -t -i :7001)
```

## Documentation 
[中文](https://docs.nebula-graph.com.cn/3.1.0/nebula-studio/about-studio/st-ug-what-is-graph-studio/)
[ENGLISH](https://https://docs.nebula-graph.io/3.1.0/nebula-studio/about-studio/st-ug-what-is-graph-studio/)

## Contributing
Contributions are warmly welcomed and greatly appreciated. Please see [Guide Docs](https://github.com/vesoft-inc/nebula-studio/blob/master/CONTRIBUTING.md) 