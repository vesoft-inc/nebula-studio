import { exec } from 'child_process';
import { Controller } from 'egg';
import fs from 'fs';

let isFinish: boolean = true;
let importProcess: any;

export default class ImportController extends Controller {
  async import() {
    const { ctx } = this;
    const { localPath } = ctx.request.body;
    isFinish = false;
    importProcess = exec(
      './nebula-importer --config ' + localPath + '/tmp/config.yaml',
      {
        cwd: '../nebula-importer', // rely on nebula-importer in the peer directory
        maxBuffer: 1024 * 1024 * 1024,
      },
    );
    ctx.response.body = {
      message: '',
      data: [],
      code: '0',
    };
  }

  async testImport() {
    const { ctx } = this;
    const { localPath } = ctx.request.body;
    const { message, code } = await ctx.service.import.importTest(localPath);
    ctx.response.body = {
      message,
      data: [],
      code,
    };
  }

  async killProcesss() {
    const { ctx } = this;
    const code = await ctx.service.import.stopImport();
    isFinish = true;
    if (code === '-1') {
      importProcess.kill();
    }
    ctx.response.body = {
      message: '',
      data: [],
      code: '0',
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
    setTimeout(() => {
      isFinish = true;
    }, 2000); // log reading interval 2000ms
    ctx.response.body = {
      message: '',
      data: '',
      code: '0',
    };
  }

  async createConfigFile() {
    const { ctx } = this;
    const {
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      activeStep,
      port,
    } = ctx.request.body;
    const vertexToJSON = await ctx.service.import.vertexDataToJSON(
      vertexesConfig,
      activeStep,
      mountPath,
    );
    const edgeToJSON = await ctx.service.import.edgeDataToJSON(
      edgesConfig,
      activeStep,
      mountPath,
    );
    const files: any[] = [...vertexToJSON, ...edgeToJSON];
    const configJson = {
      version: 'v1rc1',
      description: 'web console import',
      clientSettings: {
        concurrency: 10,
        channelBufferSize: 128,
        space: currentSpace,
        connection: {
          user: username,
          password,
          address: host,
        },
      },
      httpSettings: {
        port: 5699,
        callback: `http://localhost:${port}/api/import/finish`,
      },
      logPath: mountPath + '/tmp/import.log',
      files,
    };
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
