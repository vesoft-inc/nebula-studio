import { exec } from 'child_process';
import { Controller } from 'egg';
import fs from 'fs';

let isFinish: boolean = true;
let importProcess: any;

export default class ImportController extends Controller {
  async import() {
    // rely on nebula-importer in the peer directory
    const { ctx } = this;
    const { localPath } = ctx.request.body;
    isFinish = false;
    importProcess = exec(
      './nebula-importer --config ' + localPath + '/tmp/config.yaml',
      {
        cwd: '../nebula-importer',
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
    importProcess.kill();
    isFinish = true;
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
    const { startByte, endByte, dir } = ctx.query;
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
    if (!data && isFinish) {
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
        callback: 'http://localhost:7002/api/import/finish',
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
