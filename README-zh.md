# Nebula Web Console

## 快速开始

### 应用功能尝试
[Nebula Console工具镜像运行](./docker/README.md)

### 开发
#### Node服务
```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

#### Go服务
由于Nebula目前还没有Node语言的客户端支持，所以此处单启动了一个Go语言版本的client restful风格的api，提供给Node层代理调用
[Go 服务启动文档](./nebula-go-api/README.md)

#### 样例数据初始化
[样例数据](./docs/data-init.md)

### 部署

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
