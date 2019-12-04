import { exec } from 'child_process';
import { Controller } from 'egg';
import fs from 'fs';

import manifestMap from '../../config/manifest.json';

export default class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    await ctx.render('index.html', {
      Env: ctx.app.env,
      ManifestMap: manifestMap,
    });
  }

  async import() {
    const { ctx } = this;
    const query = ctx.request.body;
    exec(
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
      (error, stdout, stderr) => {
        console.log(error, stdout, stderr);
      },
    );
    ctx.response.body = {
      message: '',
      data: [],
      code: 0,
    };
  }

  // async refresh() {
  //   const { ctx } = this;
  //   const query = ctx.request.body;

  //   ctx.response.body = {
  //     message: '',
  //     data: [],
  //     code: 0,
  //   };
  // }

  async readLog() {
    const { ctx } = this;
    const query = ctx.request.body;
    let data: any;
    try {
      data = fs.readFileSync(query.localDir + 'err/import.log', 'utf-8');
    } catch (e) {
      data = 'read file error';
    }
    const log = data.replace(/\n/g, '<br />');
    ctx.response.body = {
      message: '',
      data: log,
      code: 0,
    };
  }
}
