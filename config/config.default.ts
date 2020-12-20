import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import fs from 'fs';
import * as path from 'path';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // upload path
  config.uploadPath =
    __dirname
      .split('/')
      .slice(0, __dirname.split('/').length - 1)
      .join('/') + '/tmp/upload';
  if (!fs.existsSync(config.uploadPath)) {
    fs.mkdirSync(config.uploadPath + '/tmp', { recursive: true });
  }
  // production environment use
  if (process.env.UPLOAD_DIR) {
    fs.mkdirSync(process.env.UPLOAD_DIR + '/tmp', { recursive: true });
  }
  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1544867050896_3341';

  // add your egg config in here
  config.middleware = [];

  config.view = {
    root: path.join(appInfo.baseDir, 'app/assets'),
    mapping: {
      '.html': 'assets',
    },
  };

  config.assets = {
    publicPath: '/public/',
    templatePath: path.join(appInfo.baseDir, 'app/assets/index.html'),
    templateViewEngine: 'nunjucks',
    devServer: {
      debug: false,
      command:
        'webpack-dev-server --config config/webpack.dev.ts --mode development --color --progress --hot',
      port: 8888,
      env: {
        PUBLIC_PATH: 'http://127.0.0.1:8888',
      },
    },
  };

  config.cluster = {
    listen: {
      port: 7001,
      hostname: '0.0.0.0',
    },
  };

  config.multipart = {
    fileSize: '5GB',
    mode: 'stream',
    fileModeMatch: /^\/upload_file$/,
    whitelist: ['.csv'],
  };

  config.security = {
    csrf: false,
  };

  config.siteFile = {
    '/favicon.ico': fs.readFileSync(path.join(__dirname, '../favicon.ico'))
  };

  // add your special config in here
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
  };

  // the return config will combines to EggAppConfig
  return {
    ...config,
    ...bizConfig,
  };
};
