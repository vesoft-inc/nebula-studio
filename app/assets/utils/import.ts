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
