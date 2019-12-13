import child_process from 'child_process';
import { Service } from 'egg';
import fs from 'fs';
import _ from 'lodash';
import util from 'util';

/**
 * Import Service
 */
export default class Import extends Service {
  async importTest(path: string) {
    const exec = util.promisify(child_process.exec);
    let code = '0';
    let message = '';
    const data = await exec(
      'docker run --rm --network=host  -v ' +
        path +
        '/config.yaml:' +
        path +
        '/config.yaml -v ' +
        path +
        ':/root ' +
        ' vesoft/nebula-importer --config ' +
        path +
        '/config.yaml',
      {
        cwd: '../nebula-importer',
        maxBuffer: 1024 * 1024 * 1024,
      },
    );
    if (data.stderr) {
      code = '-1';
      message = 'import error';
    }
    return { code, message };
  }

  async edgeDataToJSON(config: any, currentStep: number) {
    const limit = currentStep === 2 || currentStep === 3 ? 10 : undefined;
    const files = config.map(edge => {
      const edgePorps: any[] = [];
      _.sortBy(edge.props, t => {
        return t.mapping;
      }).forEach(prop => {
        switch (prop.name) {
          case 'rank':
            edge.rank = {
              index: prop.mapping,
            };
            break;
          case 'srcId':
            edge.srcVID = {
              index: prop.mapping,
              function: prop.useHash,
            };
            break;
          case 'dstId':
            edge.dstVID = {
              index: prop.mapping,
              function: prop.useHash,
            };
            break;
          default:
            const _prop = {
              name: prop.name,
              type: prop.type,
            };
            edgePorps.push(_prop);
        }
      });
      const edgeConfig = {
        path: `./${edge.file.name}`,
        failDataPath: `./err/${edge.name}Fail.scv`,
        batchSize: 10,
        limit,
        type: 'csv',
        csv: {
          withHeader: false,
          withLabel: false,
        },
        schema: {
          type: edge.file.dataType,
          [edge.file.dataType]: {
            name: edge.type,
            srcVID: edge.srcVID,
            dstVID: edge.dstVID,
            rank: edge.rank,
            withRanking: false,
            props: edgePorps,
          },
        },
      };
      return edgeConfig;
    });
    return files;
  }

  async vertexDataToJSON(config: any, currentStep: number) {
    const limit = currentStep === 2 || currentStep === 3 ? 10 : undefined;
    const files = config.map(vertex => {
      const tags = vertex.tags.map(tag => {
        const propsArr = _.sortBy(tag.props, t => {
          return t.mapping;
        });
        const props: any[] = [];
        propsArr.forEach(prop => {
          if (prop.name === 'vertexId') {
            vertex.vid = {
              index: prop.mapping,
              function: prop.useHash,
            };
          } else {
            const _prop = {
              name: prop.name,
              type: prop.type,
              index: prop.mapping,
            };
            props.push(_prop);
          }
        });
        const _tag = {
          name: tag.name,
          props,
        };
        return _tag;
      });
      const vertexConfig = {
        path: `./${vertex.file.name}`,
        failDataPath: `./err/${vertex.name}Fail.scv`,
        batchSize: 10,
        limit,
        type: 'csv',
        csv: {
          withHeader: false,
          withLabel: false,
        },
        schema: {
          type: vertex.file.dataType,
          [vertex.file.dataType]: {
            vid: vertex.vid,
            tags,
          },
        },
      };
      return vertexConfig;
    });
    return files;
  }

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
