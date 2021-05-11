import { Context } from 'egg';
import httpProxy from 'http-proxy-middleware';
import k2c from 'koa2-connect';

export default () => {
  const proxyPath = /\/api-nebula\//;
  const importPath = /\/api-import\//;

  return async function proxyHandler(ctx: Context, next: any) {
    if (proxyPath.test(ctx.request.url)) {
      const nebulaProxy = k2c(
        httpProxy({
          target: 'http://localhost:8080',
          pathRewrite: {
            '/api-nebula': '/api',
          },
          changeOrigin: true,
        }),
      );
      await nebulaProxy(ctx, next);
    } else if (importPath.test(ctx.request.url)) {
      const importProxy = k2c(
        httpProxy({
          target: 'http://localhost:5699',
          pathRewrite: {
            '/api-import': '/',
          },
          changeOrigin: true,
        }),
      );
      await importProxy(ctx, next);
    } else {
      await next();
    }
  };
};
