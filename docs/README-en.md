# Nebula Web Console

## QuickStart

### Try
[Nebula Console Docker Run](../docker/README.md)

### Dev
#### node server
```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```
#### go server
this is for nebula database service for lack of nebula node client which proxy our node relative nebula apis 
[go server start](./nebula-go-api/README.md)

#### nebula sample data init
[sample data init](./docs/data-init.md)

### Deploy

```bash
$ npm run build - build
$ npm start - start server
```

### Relative Commands

- Use `npm run lint` to check code style
- Use `npm test` to run unit test
- se `npm run clean` to clean compiled js at development mode once

## Required

- Node.js 8.x
- Typescript 2.8+
- docker

## Docs
- [Project Style Introduction](./docs/style.md)
- [Nebula Server Data Init](./docs/data-init.md)
