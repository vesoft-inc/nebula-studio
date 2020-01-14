import { Controller } from 'egg';

import manifestMap from '../../config/manifest.json';
import pkg from '../../package.json';

export default class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    await ctx.render('index.html', {
      Env: ctx.app.env,
      ManifestMap: manifestMap,
    });
  }

  async getAppInfo() {
    const { ctx } = this;

    ctx.response.body = {
      version: pkg.version,
    };
  }
}
