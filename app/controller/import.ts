import { Controller } from 'egg';
import fs from 'fs';

let isFinish: boolean = true;

export default class ImportController extends Controller {
  async import() {
    const { ctx } = this;
    isFinish = false;
    ctx.response.body = {
      data: [],
      code: '0',
    };
  }

  async testImport() {
    const { ctx } = this;
    const configJson = await ctx.service.import.configToJson(ctx.request.body);
    const code = await ctx.service.import.runImport(configJson);
    ctx.response.body = {
      data: [],
      code,
    };
  }

  async killProcesss() {
    const { ctx } = this;
    const code = await ctx.service.import.stopImport();
    isFinish = true;
    ctx.response.body = {
      message: '',
      data: [],
      code,
    };
  }

  async refresh() {
    const { ctx } = this;
    ctx.response.body = {
      message: '',
      data: isFinish,
      code: '0',
    };
  }

  async readLog() {
    const { ctx } = this;
    const { dir } = ctx.query;
    let data: any;
    let code: string = '0';
    try {
      data = fs.readFileSync(dir + '/tmp/import.log', 'utf8');
    } catch (e) {
      data = 'read file error';
    }
    if (isFinish) {
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
    isFinish = true;
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
