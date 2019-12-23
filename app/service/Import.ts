import child_process from 'child_process';
import { Service } from 'egg';
import fs from 'fs';
import _ from 'lodash';
import { promisify } from 'util';

/**
 * Import Service
 */
export default class Import extends Service {
  async importTest(path: string) {
    const exec = promisify(child_process.exec);
    let code = '-1';
    let message = 'import error';
    const data = await exec(
      './nebula-importer --config ' + path + '/tmp/config.yaml',
      {
        cwd: '../nebula-importer',
        maxBuffer: 1024 * 1024 * 1024,
      },
    );
    if (!!data.stdout) {
      code = '0';
      message = '';
    }
    return { code, message };
  }

  async edgeDataToJSON(config: any, activeStep: number, mountPath: string) {
    const limit = activeStep === 2 || activeStep === 3 ? 10 : undefined;
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
              index: prop.mapping,
            };
            edgePorps.push(_prop);
        }
      });
      const edgeConfig = {
        path: edge.file.path,
        failDataPath: `${mountPath}/tmp//err/${edge.name}Fail.scv`,
        batchSize: 10,
        limit,
        type: 'csv',
        csv: {
          withHeader: false,
          withLabel: false,
        },
        schema: {
          type: 'edge',
          edge: {
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

  async vertexDataToJSON(config: any, activeStep: number, mountPath: string) {
    const limit = activeStep === 2 || activeStep === 3 ? 10 : undefined;
    const files = config.map(vertex => {
      const tags = vertex.tags.map(tag => {
        const props = tag.props
          .sort((p1, p2) => {
            return p1.mapping - p2.mapping;
          })
          .map(prop => ({
            name: prop.name,
            type: prop.type,
            index: prop.mapping,
          }));
        const _tag = {
          name: tag.name,
          props,
        };
        return _tag;
      });
      const vertexConfig = {
        path: vertex.file.path,
        failDataPath: `${mountPath}/tmp/err/${vertex.name}Fail.scv`,
        batchSize: 10,
        limit,
        type: 'csv',
        csv: {
          withHeader: false,
          withLabel: false,
        },
        schema: {
          type: 'vertex',
          vertex: {
            vid: {
              index: vertex.idMapping,
              function: vertex.useHash,
            },
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
