import { Service } from 'egg';
import fs from 'fs';
import _ from 'lodash';

/**
 * Import Service
 */
export default class Import extends Service {
  async writeFile(path: string, content: string) {
    let code: string = '0';
    const message = await new Promise((resolve, reject) => {
      fs.writeFile(path, content, err => {
        if (err) {
          code = '-1';
          reject(err);
        }
        resolve('write file success');
      });
    });
    return { message, code };
  }
}
