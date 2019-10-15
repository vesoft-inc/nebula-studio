# nebula-go-api
this is a back end client service for nebula data server

## Run
```bash
// dev
// run nebula server docker
$ cd scripts/
$ docker-compose up -d


// run api service
$ go get github.com/pilu/fresh
$ fresh main.go
```

## Required
- Go 11+
- [beego](https://beego.me/)
- docker