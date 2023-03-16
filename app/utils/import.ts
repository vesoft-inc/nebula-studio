import { IBasicConfig } from '@app/interfaces/import';
import { IEdgeItem, ITagItem } from '@app/stores/import';
import { handleEscape, isEmpty } from './function';
import { DEFAULT_IMPORT_CONFIG } from './constant';

interface IConfig extends IBasicConfig {
  space: string;
  tagConfig: ITagItem[];
  edgeConfig: IEdgeItem[];
  username: string;
  password: string;
  spaceVidType: string;
}

export function configToJson(payload: IConfig) {
  const {
    space,
    username,
    password,
    tagConfig,
    edgeConfig,
    spaceVidType,
    batchSize,
    address,
    concurrency,
    retry,
  } = payload;
  const vertexToJSON = tagDataToJSON(
    tagConfig,
    spaceVidType,
  );
  const edgeToJSON = edgeDataToJSON(
    edgeConfig,
    spaceVidType,
  );
  const sources: any[] = [...vertexToJSON, ...edgeToJSON];
  const configJson = {
    client: {
      version: 'v3',
      address: address.join(','),
      user: username,
      password,
      concurrencyPerAddress: Number(concurrency ?? DEFAULT_IMPORT_CONFIG.concurrency),
      retry: Number(retry ?? DEFAULT_IMPORT_CONFIG.retry),
    },
    manager: {
      spaceName: handleEscape(space),
      batch: Number(batchSize) || DEFAULT_IMPORT_CONFIG.batchSize,
    },
    sources
  };
  return configJson;
}

export function edgeDataToJSON(
  configs: IEdgeItem[],
  spaceVidType: string,
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
          index: cur.mapping,
        });
        return acc;
      }, []);
      const edges = [{
        name: handleEscape(name),
        src: {
          id: {
            type: vidType,
            index: srcIdIndex,
            function: srcIdFunction,
          }
        },
        dst: {
          id: {
            type: vidType,
            index: dstIdIndex,
            function: dstIdFunction,
          }
        },
        rank: typeof rank.mapping == 'number' ? { index: rank.mapping } : null,
        props: edgeProps,
      }];
      const edgeConfig = {
        path: file.name,
        csv: {
          withHeader: file.withHeader || false,
          delimiter: file.delimiter
        },
        edges,
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
) {
  const result = configs.reduce((acc: any, cur) => {
    const { name, files } = cur;
    const _config = files.map(item => {
      const { file, props, vidIndex, vidFunction } = item;
      const _props = props.reduce((acc: any, cur) => {
        if (isEmpty(cur.mapping) && (cur.allowNull || cur.isDefault)) {
          return acc;
        }
        acc.push({
          name: handleEscape(cur.name),
          type: cur.type,
          index: cur.mapping,
        });
        return acc;
      }, []);

      const tags = [{
        name: handleEscape(name),
        id: {
          type: spaceVidType === 'INT64' ? 'int' : 'string',
          index: vidIndex,
          function: vidFunction,
        },
        props: _props.filter(prop => prop),
      }];
      return {
        path: file.name,
        csv: {
          withHeader: file.withHeader || false,
          delimiter: file.delimiter
        },
        tags
      };
    });
    acc.push(..._config);
    return acc;
  }, []);
  return result;
}

export const exampleJson = {
  'client': {
    'version': 'v3',
    'user': '',
    'password': '',
    'address': ''
  },
  'manager': {
    'spaceName': 'sales',
  },
  'sources': [
    {
      'path': 'item.csv',
      'csv': {
        'withHeader': false,
        'delimiter': null
      },
      'tags': [
        {
          'name': 'item',
          'vid': {
            'index': 0,
            'function': null,
            'type': 'string',
          },
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
    },
    {
      'path': 'orderr.csv',
      'csv': {
        'withHeader': false,
        'delimiter': null
      },
      'edges': [{
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
        'src': {
          'id': {
            'index': 1,
            'function': null,
            'type': 'string',
          }
        },
        'dst': {
          'id': {
            'index': 1,
            'function': null,
            'type': 'string',
          }
        },
        'rank': null
      }],
    }
  ]
};