import { Controller } from 'egg';
import fs from 'fs';

const taskList = new Map();

export default class ImportController extends Controller {
  async import() {
    const { ctx } = this;
    const { taskId } = ctx.query;
    taskList.set(taskId, false);
    ctx.response.body = {
      data: [],
      code: '0',
    };
  }

  async refresh() {
    const { ctx } = this;
    const { taskId } = ctx.query;
    ctx.response.body = {
      message: '',
      data: taskList.get(taskId),
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
    if (!data && taskList.get(taskId)) {
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
    const { taskId } = ctx.query;
    console.log('callback:', ctx.query);
    taskList.set(taskId, true);
    ctx.response.body = {
      message: '',
      data: '',
      code: '0',
    };
  }

  async getWorkingDir() {
    const { ctx } = this;
    ctx.response.body = {
      code: '0',
      data: {
        dir: (ctx.app.config.env as any).WORKING_DIR || process.env.WORKING_DIR,
      },
    };
  }

  async createConfigFile() {
    const { ctx } = this;
    const { mountPath } = ctx.request.body;
    const configJson = await ctx.service.import.configToJson(ctx.request.body);
    const content = JSON.stringify(configJson, null, 2);
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
