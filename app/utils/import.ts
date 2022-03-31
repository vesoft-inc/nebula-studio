import { message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import { handleEscape } from './function';

export function configToJson(payload) {
  const {
    space,
    username,
    password,
    host,
    verticesConfig,
    edgesConfig,
    taskDir,
    spaceVidType,
    batchSize
  } = payload;
  const vertexToJSON = vertexDataToJSON(
    verticesConfig,
    taskDir,
    spaceVidType,
    batchSize
  );
  const edgeToJSON = edgeDataToJSON(
    edgesConfig,
    taskDir,
    spaceVidType,
    batchSize
  );
  const files: any[] = [...vertexToJSON, ...edgeToJSON];
  const configJson = {
    version: 'v2',
    description: 'web console import',
    clientSettings: {
      retry: 3,
      concurrency: 10,
      channelBufferSize: 128,
      space: handleEscape(space),
      connection: {
        user: username,
        password,
        address: host,
      },
    },
    logPath: `${taskDir}/import.log`,
    files,
  };
  return configJson;
}

export function edgeDataToJSON(
  config: any,
  taskDir: string,
  spaceVidType: string,
  batchSize?: string,
) {
  const files = config.map(edge => {
    const edgePorps: any[] = [];
    _.sortBy(edge.props, t => t.mapping).forEach(prop => {
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
            name: handleEscape(prop.name),
            type: prop.type,
            index: indexJudge(prop.mapping, prop.name),
          };
          edgePorps.push(_prop);
      }
    });
    const fileName = edge.file.name.replace('.csv', '');
    const edgeConfig = {
      path: edge.file.path,
      failDataPath: `${taskDir}/err/${fileName}Fail.csv`,
      batchSize: Number(batchSize) || 60,
      type: 'csv',
      csv: {
        withHeader: false,
        withLabel: false,
      },
      schema: {
        type: 'edge',
        edge: {
          name: handleEscape(edge.type),
          srcVID: edge.srcVID,
          dstVID: edge.dstVID,
          rank: edge.rank,
          withRanking: edge.rank?.index !== undefined,
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
  taskDir: string,
  spaceVidType: string,
  batchSize?: string
) {
  const files = config.map(vertex => {
    const tags = vertex.tags.map(tag => {
      const props = tag.props
        .sort((p1, p2) => p1.mapping - p2.mapping)
        .map(prop => {
          if (prop.mapping === null && prop.isDefault) {
            return null;
          }
          return {
            name: handleEscape(prop.name),
            type: prop.type,
            index: indexJudge(prop.mapping, prop.name),
          };
        });
      const _tag = {
        name: handleEscape(tag.name),
        props: props.filter(prop => prop),
      };
      return _tag;
    });
    const fileName = vertex.file.name.replace('.csv', '');
    const vertexConfig: any = {
      path: vertex.file.path,
      failDataPath: `${taskDir}/err/${fileName}Fail.csv`,
      batchSize: Number(batchSize) || 60,
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

export const exampleJson = {
  'version': 'v2',
  'description': 'web console import',
  'removeTempFiles': null,
  'clientSettings': {
    'retry': 3,
    'concurrency': 10,
    'channelBufferSize': 128,
    'space': 'sales',
    'connection': {
      'user': '',
      'password': '',
      'address': ''
    },
    'postStart': null,
    'preStop': null
  },
  'logPath': 'import.log',
  'files': [
    {
      'path': 'item.csv',
      'failDataPath': 'itemFail.csv',
      'batchSize': 60,
      'limit': null,
      'inOrder': null,
      'type': 'csv',
      'csv': {
        'withHeader': false,
        'withLabel': false,
        'delimiter': null
      },
      'schema': {
        'type': 'vertex',
        'edge': null,
        'vertex': {
          'vid': {
            'index': 0,
            'function': null,
            'type': 'string',
            'prefix': null
          },
          'tags': [
            {
              'name': 'item',
              'props': [
                {
                  'name': 'id_single_item',
                  'type': 'string',
                  'index': 0
                },
                {
                  'name': 'region',
                  'type': 'string',
                  'index': 1
                },
                {
                  'name': 'country',
                  'type': 'string',
                  'index': 2
                },
                {
                  'name': 'item_type',
                  'type': 'string',
                  'index': 3
                },
                {
                  'name': 'sales_channel',
                  'type': 'string',
                  'index': 4
                }
              ]
            }
          ]
        }
      }
    },
    {
      'path': 'orderr.csv',
      'failDataPath': 'orderrFail.csv',
      'batchSize': 60,
      'limit': null,
      'inOrder': null,
      'type': 'csv',
      'csv': {
        'withHeader': false,
        'withLabel': false,
        'delimiter': null
      },
      'schema': {
        'type': 'edge',
        'edge': {
          'name': 'order',
          'withRanking': false,
          'props': [
            {
              'name': 'order_id',
              'type': 'string',
              'index': 0
            },
            {
              'name': 'id_item',
              'type': 'string',
              'index': 0
            },
            {
              'name': 'unit_sold',
              'type': 'string',
              'index': 2
            },
            {
              'name': 'unit_price',
              'type': 'string',
              'index': 3
            },
            {
              'name': 'unit_cost',
              'type': 'string',
              'index': 4
            },
            {
              'name': 'total_profit',
              'type': 'string',
              'index': 5
            }
          ],
          'srcVID': {
            'index': 1,
            'function': null,
            'type': 'string',
            'prefix': null
          },
          'dstVID': {
            'index': 1,
            'function': null,
            'type': 'string',
            'prefix': null
          },
          'rank': null
        },
        'vertex': null
      }
    }
  ]
};