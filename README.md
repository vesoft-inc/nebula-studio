# Nebula Graph Studio
Nebula Graph Studio (Studio for short) is a web-based visualization tool for Nebula Graph. With Studio, you can create a graph schema, import data, edit nGQL statements for data queries, and explore graphs.

## Development Quick Start
### Start nebula-importer
Start
```
$ git clone https://github.com/vesoft-inc/nebula-importer.git
$ cd nebula-importer
$ make build
$ ./nebula-importer --port 5699 --callback "http://0.0.0.0:7001/api/import/finish"
```

### Start nebula-http-gateway

Start
```
$ git clone https://github.com/vesoft-inc/nebula-http-gateway.git
$ cd nebula-http-gateway
$ make build
$ nohup ./nebula-httpd &
```

### Start nebula-graph-studio

Start
```
$ npm install
$ npm run dev
```

## Documentation 
[中文](https://docs.nebula-graph.com.cn/2.0.1/nebula-studio/about-studio/st-ug-what-is-graph-studio/)

## Contributing
Contributions are warmly welcomed and greatly appreciated. Please see [Guide Docs](https://github.com/vesoft-inc-private/nebula-graph-studio/blob/master/CONTRIBUTING.md) 