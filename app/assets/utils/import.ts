import { message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

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
  } = payload;
  const vertexToJSON = vertexDataToJSON(vertexesConfig, activeStep, mountPath);
  const edgeToJSON = edgeDataToJSON(edgesConfig, activeStep, mountPath);
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

export function edgeDataToJSON(
  config: any,
  activeStep: number,
  mountPath: string,
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
            function: prop.useHash === 'unset' ? undefined : prop.useHash,
          };
          break;
        case 'dstId':
          edge.dstVID = {
            index: indexJudge(prop.mapping, prop.name),
            function: prop.useHash === 'unset' ? undefined : prop.useHash,
          };
          break;
        default:
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
) {
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
          index: indexJudge(prop.mapping, prop.name),
        }));
      const _tag = {
        name: tag.name,
        props,
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
            function: vertex.useHash === 'unset' ? undefined : vertex.useHash,
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
  const { vertexesConfig, edgesConfig } = payload;
  const NGQL: string[] = [];
  vertexesConfig.forEach(vertexConfig => {
    if (vertexConfig.idMapping === null) {
      message.error(`vertexId ${intl.get('import.indexNotEmpty')}`);
      throw new Error();
    }
    const csvTable = csvToArray(vertexConfig.file.content, ',');
    vertexConfig.tags.forEach(tag => {
      csvTable.forEach(columns => {
        const tagField: string[] = [];
        const values: any[] = [];
        if (!tag.name) {
          message.error(`Tag ${intl.get('import.notEmpty')}`);
          throw new Error();
        }
        tag.props.forEach(prop => {
          if (prop.mapping === null) {
            message.error(`${prop.name} ${intl.get('import.indexNotEmpty')}`);
            throw new Error();
          }
          // HACK: Processing keyword
          tagField.push('`' + prop.name + '`');
          const value =
            prop.type === 'string'
              ? `"${columns[prop.mapping]}"`
              : columns[prop.mapping];
          values.push(value);
        });
        NGQL.push(
          'INSERT VERTEX' +
            '`' +
            tag.name +
            '`' +
            `(${tagField}) VALUES ${
              vertexConfig.useHash === 'unset'
                ? columns[vertexConfig.idMapping]
                : `${vertexConfig.useHash}("${
                    columns[vertexConfig.idMapping]
                  }")`
            }:(${values})`,
        );
      });
    });
  });
  edgesConfig.forEach(edgeConfig => {
    const csvTable = csvToArray(edgeConfig.file.content, ',');
    csvTable.forEach(columns => {
      const edgeField: string[] = [];
      const values: any[] = [];
      if (!edgeConfig.type) {
        message.error(`edgeType ${intl.get('import.notEmpty')}`);
        throw new Error();
      }
      edgeConfig.props.forEach(prop => {
        if (prop.mapping === null && prop.name !== 'rank') {
          message.error(`${prop.name} ${intl.get('import.indexNotEmpty')}`);
          throw new Error();
        }
        if (
          prop.name !== 'srcId' &&
          prop.name !== 'dstId' &&
          prop.name !== 'rank'
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
        'INSERT EDGE' +
          '`' +
          edgeConfig.type +
          '`' +
          `(${edgeField.join(',')}) VALUES ${
            edgeConfig.props[0].useHash === 'unset'
              ? columns[edgeConfig.props[0].mapping]
              : `${edgeConfig.props[0].useHash}("${
                  columns[edgeConfig.props[0].mapping]
                }")`
          } -> ${
            edgeConfig.props[1].useHash === 'unset'
              ? columns[edgeConfig.props[1].mapping]
              : `${edgeConfig.props[1].useHash}("${
                  columns[edgeConfig.props[1].mapping]
                }")`
          } ${rank}:(${values})`,
      );
    });
  });
  return NGQL;
}

// TODO: move it into a npm package in future
export function csvToArray(content, delimiter) {
  return content.split('\n').map((row: string) => {
    const cols = [] as string[];
    let isQuoteOpen = false;
    let isQuoteClose = false;
    const paddingRow = row + ',';
    for (let i = 0, j = 0, len = paddingRow.length; j < len; j++) {
      switch (paddingRow[j]) {
        case '"':
          if (!isQuoteOpen) {
            isQuoteOpen = true;
          } else {
            isQuoteClose = true;
          }
          break;
        case delimiter:
          if (!isQuoteOpen) {
            cols.push(paddingRow.substring(i, j));
            i = j + 1;
          } else if (isQuoteClose) {
            // value by quote
            cols.push(paddingRow.substring(i + 1, j - 1));
            i = j + 1;
            isQuoteClose = false;
            isQuoteOpen = false;
          }
          break;
      }
    }
    return cols;
  });
}
