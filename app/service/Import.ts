import { Service } from 'egg';
import fs from 'fs';
import _ from 'lodash';

/**
 * Import Service
 */
export default class Import extends Service {
  async configToJson(payload) {
    const {
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      activeStep,
    } = payload;
    const vertexToJSON = await this.vertexDataToJSON(
      vertexesConfig,
      activeStep,
      mountPath,
    );
    const edgeToJSON = await this.edgeDataToJSON(
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
      logPath: mountPath + '/tmp/import.log',
      files,
    };
    return configJson;
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
            if (prop.mapping !== null) {
              edge.rank = {
                index: prop.mapping,
              };
            }
            break;
          case 'srcId':
            edge.srcVID = {
              index: prop.mapping,
              function: prop.useHash === 'unset' ? undefined : prop.useHash,
            };
            break;
          case 'dstId':
            edge.dstVID = {
              index: prop.mapping,
              function: prop.useHash === 'unset' ? undefined : prop.useHash,
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
      const vertexConfig: any = {
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
              function: vertex.useHash === 'unset' ? undefined : vertex.useHash,
            },
            tags,
          },
        },
      };
      // activeStep === 2 || activeStep === 3 ? (vertexConfig.limit = 10) : null;
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
