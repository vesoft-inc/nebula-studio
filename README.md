# Nebula Web Console

## QuickStart

### Dev
#### node server
```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```
#### go server
this is for nebula database service for lack of nebula node client which proxy our node relative nebula apis 
[go server start](./go-api/README.md)

### Deploy

```bash
$ npm run build - build
$ npm start - start server
```

### Relative Commands

- Use `npm run lint` to check code style
- Use `npm test` to run unit test
- se `npm run clean` to clean compiled js at development mode once

### Required

- Node.js 8.x
- Typescript 2.8+

### Docs
- Style Required: https://github.com/vesoft-inc/nebula-web-console/blob/master/docs/style.md
