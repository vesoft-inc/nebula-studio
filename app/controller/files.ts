import { Controller } from 'egg';
import fs from 'fs';
import pump from 'mz-modules/pump';
import readline from 'readline';
import sendToWormhole from 'stream-wormhole';

export default class FilesController extends Controller {
  async destroy() {
    const { ctx } = this;
    const { id } = ctx.params;
    const dir = process.env.UPLOAD_DIR || ctx.app.config.uploadPath;
    const target = dir + '/' + id;
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
    ctx.response.body = {
      code: 0,
    };
  }

  async index() {
    const { ctx } = this;
    const dir = process.env.UPLOAD_DIR || ctx.app.config.uploadPath;
    const files = fs.readdirSync(dir);
    const data: any = [];
    await Promise.all(
      files.map(async file => {
        const fileStat: any = fs.statSync(dir + '/' + file);
        if (fileStat.isFile()) {
          fileStat.name = file;
          const content = await this._readFileByLine(`${dir}/${file}`, 3);
          fileStat.content = content
            .split('\n')
            .slice(0, 3)
            .join('\n');
          fileStat.path = dir + '/' + file;
          fileStat.withHeader = false;
          fileStat.dataType = 'all';
          data.push(fileStat);
        }
      }),
    );
    ctx.response.body = {
      code: 0,
      data,
    };
  }

  async upload() {
    const { ctx } = this;
    const parts = ctx.multipart();
    const dir = process.env.UPLOAD_DIR || ctx.app.config.uploadPath;
    let stream;
    // tslint:disable-next-line: no-conditional-assignment
    while ((stream = await parts()) != null) {
      if (!stream.filename) {
        return;
      }
      const target = dir + '/' + stream.filename;
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
      const writeStream = fs.createWriteStream(target);
      try {
        await pump(stream, writeStream);
      } catch (err) {
        await sendToWormhole(stream);
        throw err;
      }
    }

    ctx.status = 200;
    ctx.response.body = {
      code: 0,
    };
  }

  async _readFileByLine(path, lines) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const content = [] as string[];
    for await (const line of rl) {
      content.push(line);
      lines--;
      if (lines === 0) {
        break;
      }
    }
    rl.close();

    return content.join('\n');
  }
}
