import { message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import { handleVidStringName } from './function';
export function configToJson(payload) {
  const {
    currentSpace,
    username,
    password,
    host,
    vertexesConfig,
    edgesConfig,
    mountPath,
    activeStep,
    spaceVidType,
  } = payload;
  const vertexToJSON = vertexDataToJSON(
    vertexesConfig,
    activeStep,
    mountPath,
    spaceVidType,
  );
  const edgeToJSON = edgeDataToJSON(
    edgesConfig,
    activeStep,
    mountPath,
    spaceVidType,
  );
  const files: any[] = [...vertexToJSON, ...edgeToJSON];
  const configJson = {
    version: 'v2',
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

export function edgeDataToJSON(
  config: any,
  activeStep: number,
  mountPath: string,
  spaceVidType: string,
) {
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
            index: indexJudge(prop.mapping, prop.name),
            type: spaceVidType === 'INT64' ? 'int' : 'string',
          };
          break;
        case 'dstId':
          edge.dstVID = {
            index: indexJudge(prop.mapping, prop.name),
            type: spaceVidType === 'INT64' ? 'int' : 'string',
          };
          break;
        default:
          if (prop.mapping === null && prop.isDefault) {
            break;
          }
          const _prop = {
            name: prop.name,
            type: prop.type,
            index: indexJudge(prop.mapping, prop.name),
          };
          edgePorps.push(_prop);
      }
    });
    const edgeConfig = {
      path: edge.file.path,
      failDataPath: `${mountPath}/tmp//err/${edge.name}Fail.csv`,
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

export function vertexDataToJSON(
  config: any,
  activeStep: number,
  mountPath: string,
  spaceVidType: string,
) {
  const limit = activeStep === 2 || activeStep === 3 ? 10 : undefined;
  const files = config.map(vertex => {
    const tags = vertex.tags.map(tag => {
      const props = tag.props
        .sort((p1, p2) => {
          return p1.mapping - p2.mapping;
        })
        .map(prop => {
          if (prop.mapping === null && prop.isDefault) {
            return null;
          }
          return {
            name: prop.name,
            type: prop.type,
            index: indexJudge(prop.mapping, prop.name),
          };
        });
      const _tag = {
        name: tag.name,
        props: props.filter(prop => prop),
      };
      return _tag;
    });
    const vertexConfig: any = {
      path: vertex.file.path,
      failDataPath: `${mountPath}/tmp/err/${vertex.name}Fail.csv`,
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
            index: indexJudge(vertex.idMapping, 'vertexId'),
            type: spaceVidType === 'INT64' ? 'int' : 'string',
          },
          tags,
        },
      },
    };
    return vertexConfig;
  });
  return files;
}

export function indexJudge(index: number | null, name: string) {
  if (index === null) {
    message.error(`${name} ${intl.get('import.indexNotEmpty')}`);
    throw new Error();
  }
  return index;
}

export function getStringByteLength(str: string) {
  let bytesCount = 0;
  const len = str.length;
  for (let i = 0, n = len; i < n; i++) {
    const c = str.charCodeAt(i);
    if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
      bytesCount += 1;
    } else {
      bytesCount += 2;
    }
  }
  return bytesCount;
}

export function createTaskID(instanceId: string) {
  return `${instanceId}.${new Date().getTime()}`;
}

export function getGQLByConfig(payload) {
  const { vertexesConfig, edgesConfig, spaceVidType } = payload;
  const NGQL: string[] = [];
  vertexesConfig.forEach(vertexConfig => {
    if (vertexConfig.idMapping === null) {
      message.error(`vertexId ${intl.get('import.indexNotEmpty')}`);
      throw new Error();
    }
    const csvTable = vertexConfig.file.content;
    vertexConfig.tags.forEach(tag => {
      csvTable.forEach(columns => {
        const tagField: string[] = [];
        const values: any[] = [];
        if (!tag.name) {
          message.error(`Tag ${intl.get('import.notEmpty')}`);
          throw new Error();
        }
        tag.props.forEach(prop => {
          if (prop.mapping === null && !prop.isDefault) {
            message.error(`${prop.name} ${intl.get('import.indexNotEmpty')}`);
            throw new Error();
          }
          if (prop.mapping !== null) {
            // HACK: Processing keyword
            tagField.push('`' + prop.name + '`');
            const value =
              prop.type === 'string'
                ? `"${columns[prop.mapping]}"`
                : columns[prop.mapping];
            values.push(value);
          }
        });
        NGQL.push(
          'INSERT VERTEX ' +
            '`' +
            tag.name +
            '`' +
            `(${tagField}) VALUES ${handleVidStringName(
              columns[vertexConfig.idMapping],
              spaceVidType,
            )}:(${values})`,
        );
      });
    });
  });
  edgesConfig.forEach(edgeConfig => {
    const csvTable = edgeConfig.file.content;
    csvTable.forEach(columns => {
      const edgeField: string[] = [];
      const values: any[] = [];
      if (!edgeConfig.type) {
        message.error(`edgeType ${intl.get('import.notEmpty')}`);
        throw new Error();
      }
      edgeConfig.props.forEach(prop => {
        if (prop.mapping === null && prop.name !== 'rank' && !prop.isDefault) {
          message.error(`${prop.name} ${intl.get('import.indexNotEmpty')}`);
          throw new Error();
        }
        if (
          prop.name !== 'srcId' &&
          prop.name !== 'dstId' &&
          prop.name !== 'rank' &&
          prop.mapping !== null
        ) {
          // HACK: Processing keyword
          edgeField.push('`' + prop.name + '`');
          const value =
            prop.type === 'string'
              ? `"${columns[prop.mapping]}"`
              : columns[prop.mapping];
          values.push(value);
        }
      });
      const rank =
        edgeConfig.props[2].mapping === null
          ? ''
          : `@${columns[edgeConfig.props[2].mapping]}`;
      NGQL.push(
        'INSERT EDGE ' +
          '`' +
          edgeConfig.type +
          '`' +
          `(${edgeField.join(',')}) VALUES ${handleVidStringName(
            columns[edgeConfig.props[0].mapping],
            spaceVidType,
          )} -> ${handleVidStringName(
            columns[edgeConfig.props[1].mapping],
            spaceVidType,
          )} ${rank}:(${values})`,
      );
    });
  });
  return NGQL;
}
