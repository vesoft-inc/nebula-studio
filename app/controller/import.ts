import { exec } from 'child_process';
import { Controller } from 'egg';
import fs from 'fs';

let isFinish: boolean = true;
let importProcess: any;

export default class ImportController extends Controller {
  async import() {
    const { ctx } = this;
    const query = ctx.request.body;
    isFinish = false;
    importProcess = exec(
      'docker run --rm --network=host  -v ' +
        query.config +
        ':' +
        query.config +
        ' -v ' +
        query.localDir +
        ':/root ' +
        ' vesoft/nebula-importer --config ' +
        query.config,
      {
        cwd: '../nebula-importer',
        maxBuffer: 1024 * 1024 * 1024,
      },
      () => {
        isFinish = true;
      },
    );
    ctx.response.body = {
      message: '',
      data: [],
      code: '0',
    };
  }

  async killProcesss() {
    const { ctx } = this;
    importProcess.kill();
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
      readStream = fs.createReadStream(dir + 'err/import.log', {
        start: Number(startByte),
        end: Number(endByte),
        encoding: 'utf8',
      });
    } catch (e) {
      data = 'read file error';
    }
    data = await new Promise(resolve => {
      let _data: any;
      readStream.on('data', chunk => {
        _data = chunk.toString();
      });
      readStream.on('end', () => {
        resolve(_data);
      });
    });
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
}
