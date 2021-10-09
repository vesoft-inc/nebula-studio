# Nebula Graph Studio
Nebula Graph Studio (Studio for short) is a web-based visualization tool for Nebula Graph. With Studio, you can create a graph schema, import data, edit nGQL statements for data queries, and explore graphs.
![](./introduction.png)

## Architecture
![](architecture.png)

## Development Quick Start

### Set up nebula-http-gateway
```
$ git clone https://github.com/vesoft-inc/nebula-http-gateway.git
$ cd nebula-http-gateway
$ make build
$ nohup ./nebula-httpd &
```

### Set up nebula-graph-studio
```
$ npm install
$ npm run dev
```

## Production Deploy

### 1. Build
```
$ npm run install
$ npm run build
```

### 2. Compile Typescript
```
$ npm run tsc
```

### 3. Deploy
```
$ npm run start
```

### 4. Stop Server
Use when you want shutdown the web app
```
$ npm run stop
```

## Documentation 
[中文](https://docs.nebula-graph.com.cn/2.5.0/nebula-studio/about-studio/st-ug-what-is-graph-studio/)
[ENGLISH](https://https://docs.nebula-graph.io/2.5.0/nebula-studio/about-studio/st-ug-what-is-graph-studio/)

## Contributing
Contributions are warmly welcomed and greatly appreciated. Please see [Guide Docs](https://github.com/vesoft-inc-private/nebula-graph-studio/blob/master/CONTRIBUTING.md) 