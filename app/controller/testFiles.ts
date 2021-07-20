import { Controller } from 'egg';
import fs from 'fs';

export default class TestFilesController extends Controller {
  async create() {
    const { ctx } = this;
    const { total, type, hierarchy } = ctx.request.body;
    switch (type) {
      case 1:
        this._createCircleGraphByScale(total);
        break;
      case 2:
        this._createCircleGraphByNum(total);
        break;
      case 3:
        this._createMeshGraph(hierarchy);
        break;
      default:
        break;
    }

    ctx.response.body = {
      code: 0,
    };
  }

  private _createCircleGraphByScale(total) {
    const { ctx } = this;
    const dir = process.env.UPLOAD_DIR || ctx.app.config.uploadPath;
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
      fs.appendFileSync(
        `${dir}/edge.csv`,
        `${total},${(total / 5) * 1}, 20${(total / 5) * 1} \r\n`,
      );
      fs.appendFileSync(
        `${dir}/edge.csv`,
        `${total},${(total / 5) * 2}, 20${(total / 5) * 2} \r\n`,
      );
      fs.appendFileSync(
        `${dir}/edge.csv`,
        `${total},${(total / 5) * 3}, 20${(total / 5) * 3} \r\n`,
      );
      fs.appendFileSync(
        `${dir}/edge.csv`,
        `${total},${(total / 5) * 4}, 20${(total / 5) * 4} \r\n`,
      );
      fs.appendFileSync(
        `${dir}/edge.csv`,
        `${total},${(total / 5) * 5}, 20${(total / 5) * 5} \r\n`,
      );
      i++;
    }
  }

  private _createCircleGraphByNum(total) {
    const { ctx } = this;
    const dir = process.env.UPLOAD_DIR || ctx.app.config.uploadPath;
    const num = 20; // init num
    let i = 1;
    for (let index = 1; index < total; index = num * i) {
      for (let j = 1; j < 20; j++) {
        fs.appendFileSync(
          `${dir}/edge.csv`,
          `${index},${index + j}, 20${j} \r\n`,
        );
      }
      i++;
      for (let l = i; l < i + 5; l++) {
        fs.appendFileSync(
          `${dir}/edge.csv`,
          `${index},${num * l}, 20${num * i} \r\n`,
        );
      }
    }
    let k = 1;
    while (k <= total) {
      fs.appendFileSync(`${dir}/node.csv`, `${k},name${k},20 \r\n`);
      k++;
    }
  }
  private _createMeshGraph(hierarchy) {
    const { ctx } = this;
    const dir = process.env.UPLOAD_DIR || ctx.app.config.uploadPath;
    let index = 0;
    let startNodes = [1];
    let maxNode = 1;
    while (index < hierarchy) {
      const _startNodes = [] as any;
      startNodes.forEach(startNode => {
        const num = Math.floor(Math.random() * 7) + 3;
        for (let j = 0; j < num; j++) {
          fs.appendFileSync(
            `${dir}/edge.csv`,
            `${startNode},${maxNode + j + 1}, 20${maxNode + j + 1} \r\n`,
          );
          _startNodes.push(maxNode + j + 1);
          maxNode = maxNode + j + 1;
        }
      });
      startNodes = _startNodes;
      index++;
    }
  }
}
