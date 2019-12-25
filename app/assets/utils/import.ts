import { notification } from 'antd';
import _ from 'lodash';

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
    port,
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
    httpSettings: {
      port: 5699,
      callback: `http://localhost:${port}/api/import/finish`,
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
            index: indexJudge(prop.mapping),
            function: prop.useHash === 'unset' ? undefined : prop.useHash,
          };
          break;
        case 'dstId':
          edge.dstVID = {
            index: indexJudge(prop.mapping),
            function: prop.useHash === 'unset' ? undefined : prop.useHash,
          };
          break;
        default:
          const _prop = {
            name: prop.name,
            type: prop.type,
            index: indexJudge(prop.mapping),
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
          index: indexJudge(prop.mapping),
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
            index: indexJudge(vertex.idMapping),
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
export function indexJudge(index: number | null) {
  if (index === null) {
    notification.error({
      message: `CSV Index cannot be null`,
      description: `config error`,
    });
    return false;
  }
  return index;
}
