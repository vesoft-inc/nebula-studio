import { Controller } from 'egg';
import fs from 'fs';

export default class TestFilesController extends Controller {
  async create() {
    const { ctx } = this;
    const { total, type } = ctx.request.body;
    const dir = process.env.UPLOAD_DIR || ctx.app.config.uploadPath;
    if (type === 1) {
      let i = 0;
      while (i <= total) {
        // tag type (id , name string, age int)
        fs.appendFileSync(`${dir}/node.csv`, `${i},name${i},20 \r\n`);
        switch (true) {
          case i < (total / 5) * 1:
            // if node id < total * 1/5 ,create edge with id:1
            fs.appendFileSync(`${dir}/edge.csv`, `1,${i}, 20${i} \r\n`);
            break;
          case i < (total / 5) * 2:
            // if node id < total * 2/5 ,create edge with id:total * 5
            fs.appendFileSync(
              `${dir}/edge.csv`,
              `${total / 5},${i}, 20${i} \r\n`,
            );
            break;
          case i < (total / 5) * 3:
            // if node id < total * 3/5 ,create edge with id:total * 2/5
            fs.appendFileSync(
              `${dir}/edge.csv`,
              `${(total / 5) * 2},${i}, 20${i} \r\n`,
            );
            break;
          case i < (total / 5) * 4:
            // if node id < total * 4/5 ,create edge with id:total * 3/5
            fs.appendFileSync(
              `${dir}/edge.csv`,
              `${(total / 5) * 3},${i}, 20${i} \r\n`,
            );
            break;
          default:
            // the rest of the ,create edge with total
            fs.appendFileSync(`${dir}/edge.csv`, `${total},${i}, 20${i} \r\n`);
            break;
        }
        i++;
      }
    } else {
      const num = 20;
      let i = 1;
      for (let index = 1; index < total; index = num * i) {
        for (let j = 1; j < 20; j++) {
          fs.appendFileSync(
            `${dir}/edge.csv`,
            `${index},${index + j}, 20${j} \r\n`,
          );
        }
        i++;
        fs.appendFileSync(
          `${dir}/edge.csv`,
          `${index},${num * i}, 20${num * i} \r\n`,
        );
      }
      let k = 1;
      while (k <= total) {
        fs.appendFileSync(`${dir}/node.csv`, `${k},name${k},20 \r\n`);
        k++;
      }
    }

    ctx.response.body = {
      code: 0,
    };
  }
}
