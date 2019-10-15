import { Context } from 'egg';
import httpProxy from 'http-proxy-middleware';
import k2c from 'koa2-connect';

export default () => {
  const nebulaProxy = k2c(
    httpProxy({
      target: 'http://127.0.0.1:8080',
      pathRewrite: {
        '/api-nebula': '/api',
      },
      changeOrigin: true,
    }),
  );
  const proxyPath = /\/api-nebula\//;

  return async function proxyHandler(ctx: Context, next: any) {
    if (proxyPath.test(ctx.request.url)) {
      await nebulaProxy(ctx, next);
    } else {
      await next();
    }
  };
};
