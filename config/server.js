const path = require('path');
const process = require('process');
const fs = require('fs');
const chalk = require('chalk');
const { spawn, spawnSync } = require('child_process');
const webpack = require('webpack');
const openBrowser = require('react-dev-utils/openBrowser');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.dev');

const compiler = webpack(config);
const portal = config.devServer.https ? 'https' : 'http';
const port = config.devServer.port;
const ip = config.devServer.host || '127.0.0.1';

const goServerPath = path.resolve(process.cwd(), './server');

const goServerProcess = spawn('go run main.go', { cwd: goServerPath, shell: true });
goServerProcess.stdout.on('data', (data) => console.log(chalk.blue(`server::${data.toString().slice(0, -1)}`)));
goServerProcess.on('close', () =>
  console.log(chalk.red('\ngo server 启动失败，服务器将不可用，请切换到 server 目录调试异常\n'))
);

const server = new WebpackDevServer(config.devServer, compiler);
server.startCallback(() => {
  console.log(`Listening at localhost: ${port}`);
  console.log('Opening your system browser...');
  openBrowser(`${portal}://${ip}:${port}`);
});

process.on('exit', (code) => {
  console.log(`process exits with code: ${code}`);
});
