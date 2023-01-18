import { message } from 'antd';
import { getI18n } from '@vesoft-inc/i18n';
import { IBasicConfig } from '@app/interfaces/import';
import { IEdgeItem, ITagItem } from '@app/stores/import';
import { handleEscape } from './function';
import { DEFAULT_IMPORT_CONFIG } from './constant';

interface IConfig extends IBasicConfig {
  space: string;
  tagConfig: ITagItem[];
  edgesConfig: IEdgeItem[];
  username: string;
  password: string;
  spaceVidType: string;
}

const isEmpty = (value: any) => {
  return !value && value !== 0;
};
export function configToJson(payload: IConfig) {
  const {
    space,
    username,
    password,
    tagConfig,
    edgesConfig,
    spaceVidType,
    batchSize,
    address,
    concurrency,
    retry,
    channelBufferSize
  } = payload;
  const vertexToJSON = tagDataToJSON(
    tagConfig,
    spaceVidType,
    batchSize
  );
  const edgeToJSON = edgeDataToJSON(
    edgesConfig,
    spaceVidType,
    batchSize
  );
  const files: any[] = [...vertexToJSON, ...edgeToJSON];
  const configJson = {
    version: 'v2',
    description: 'studio import',
    clientSettings: {
      retry: Number(retry ?? DEFAULT_IMPORT_CONFIG.retry),
      concurrency: Number(concurrency ?? DEFAULT_IMPORT_CONFIG.concurrency),
      channelBufferSize: Number(channelBufferSize ?? DEFAULT_IMPORT_CONFIG.channelBufferSize),
      space: handleEscape(space),
      connection: {
        user: username,
        password,
        address: address.join(', ')
      },
    },
    files,
  };
  return configJson;
}

export function edgeDataToJSON(
  configs: IEdgeItem[],
  spaceVidType: string,
  batchSize?: string,
) {
  const result = configs.reduce((acc: any, cur) => {
    const { name, files } = cur;
    const _config = files.map(item => {
      const { file, props, srcIdIndex, srcIdFunction, dstIdIndex, dstIdFunction } = item;
      const vidType = spaceVidType === 'INT64' ? 'int' : 'string';
      // rank is the last prop
      const rank = props[props.length - 1];
      const edgeProps = props.slice(0, -1).reduce((acc: any, cur) => {
        if (isEmpty(cur.mapping) && (cur.allowNull || cur.isDefault)) {
          return acc;
        }
        acc.push({
          name: handleEscape(cur.name),
          type: cur.type,
          index: indexJudge(cur.mapping, cur.name),
        });
        return acc;
      }, []);
      const edgeConfig = {
        path: file.name,
        batchSize: Number(batchSize) || DEFAULT_IMPORT_CONFIG.batchSize,
        type: 'csv',
        csv: {
          withHeader: file.withHeader || false,
          withLabel: false,
          delimiter: file.delimiter
        },
        schema: {
          type: 'edge',
          edge: {
            name: handleEscape(name),
            srcVID: {
              index: srcIdIndex,
              function: srcIdFunction,
              type: vidType,
            },
            dstVID: {
              index: dstIdIndex,
              function: dstIdFunction,
              type: vidType,
            },
            rank: { index: rank.mapping },
            props: edgeProps,
          },
        },
      };
      return edgeConfig;
    });
    acc.push(..._config);
    return acc;
  }, []);
  return result;
}

export function tagDataToJSON(
  configs: ITagItem[],
  spaceVidType: string,
  batchSize?: string
) {
  const result = configs.reduce((acc: any, cur) => {
    const { name, files } = cur;
    const _config = files.map(item => {
      const { file, props, vidIndex, vidFunction, vidPrefix } = item;
      const _props = props.reduce((acc: any, cur) => {
        if (isEmpty(cur.mapping) && (cur.allowNull || cur.isDefault)) {
          return acc;
        }
        acc.push({
          name: handleEscape(cur.name),
          type: cur.type,
          index: indexJudge(cur.mapping, cur.name),
        });
        return acc;
      }, []);

      const tags = [{
        name: handleEscape(name),
        props: _props.filter(prop => prop),
      }];
      return {
        path: file.name,
        batchSize: Number(batchSize) || DEFAULT_IMPORT_CONFIG.batchSize,
        type: 'csv',
        csv: {
          withHeader: file.withHeader || false,
          withLabel: false,
          delimiter: file.delimiter
        },
        schema: {
          type: 'vertex',
          vertex: {
            vid: {
              index: indexJudge(vidIndex, 'vertexId'),
              function: vidFunction,
              type: spaceVidType === 'INT64' ? 'int' : 'string',
              prefix: vidPrefix,
            },
            tags,
          },
        }
      };
    });
    acc.push(..._config);
    return acc;
  }, []);
  return result;
}

export function indexJudge(index: number | null, name: string) {
  if (isEmpty(index)) {
    const { intl } = getI18n();
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
          },
          'dstVID': {
            'index': 1,
            'function': null,
            'type': 'string',
          },
          'rank': null
        },
        'vertex': null
      }
    }
  ]
};