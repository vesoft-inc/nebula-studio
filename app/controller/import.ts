import { Controller } from 'egg';
import fs from 'fs';

const taskIdDir =
  __dirname
    .split('/')
    .slice(0, __dirname.split('/').length - 2)
    .join('/') + '/tmp/taskId.json';

if (!fs.existsSync(taskIdDir)) {
  fs.writeFileSync(taskIdDir, JSON.stringify({}));
}

export default class ImportController extends Controller {
  async import() {
    const { ctx } = this;
    const { taskId } = ctx.request.body;
    const taskIdJSON = require(taskIdDir);
    taskIdJSON[taskId] = false;
    fs.writeFileSync(taskIdDir, JSON.stringify(taskIdJSON));
    ctx.response.body = {
      data: [],
      code: '0',
    };
  }

  async readLog() {
    const { ctx } = this;
    const { startByte, endByte, dir, taskId } = ctx.query;
    let data: any;
    let readStream: any;
    let code: string = '0';
    try {
      readStream = fs.createReadStream(dir + '/tmp/import.log', {
        start: Number(startByte),
        end: Number(endByte),
        encoding: 'utf8',
      });
      data = await new Promise(resolve => {
        let _data: any;
        readStream.on('data', chunk => {
          _data = chunk.toString();
        });
        readStream.on('end', () => {
          resolve(_data);
        });
      });
    } catch (e) {
      data = 'read file error';
    }
    const taskIdJSON = require(taskIdDir);
    if (!data && taskIdJSON[taskId]) {
      code = '-1';
    }
    const log = data ? data.replace(/\n/g, '<br />') : '';
    ctx.response.body = {
      message: '',
      data: log,
      code,
    };
  }

  async callback() {
    const { ctx } = this;
    const { taskId } = ctx.request.body;
    const taskIdJSON = require(taskIdDir);
    taskIdJSON[taskId] = true;
    fs.writeFileSync(taskIdDir, JSON.stringify(taskIdJSON));
    ctx.response.body = {
      message: '',
      data: '',
      code: '0',
    };
  }

  async getWorkingDir() {
    const { ctx } = this;
    const dir = process.env.UPLOAD_DIR || ctx.app.config.uploadPath;
    ctx.response.body = {
      code: '0',
      data: {
        dir,
      },
    };
  }

  async createConfigFile() {
    const { ctx } = this;
    const { mountPath, config } = ctx.request.body;
    const content = JSON.stringify(config, null, 2);
    const { message, code } = await ctx.service.import.writeFile(
      mountPath + '/tmp/config.yaml',
      content,
    );
    ctx.response.body = {
      message,
      data: [],
      code,
    };
  }
}
