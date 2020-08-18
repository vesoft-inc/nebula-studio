import { createModel } from '@rematch/core';
import { message } from 'antd';
import cookies from 'js-cookie';
import _ from 'lodash';
import intl from 'react-intl-universal';

import service from '#assets/config/service';
import { trackEvent } from '#assets/utils/stat';

interface IState {
  spaces: string[];
  currentSpace: string;
  edgeTypes: string[];
  host: string;
  username: string;
  password: string;
  tagsFields: any[];
  edgesFields: any[];
  indexes: any[];
  tagsWithIndexInfo: ITag[];
}

interface IIndex {
  indexName: string;
  props: IField[];
}
interface ITag {
  tagName: string;
  indexes: IIndex[];
}

interface IField {
  Field: string;
  Type: string;
}

export const nebula = createModel({
  state: {
    username: cookies.get('nu'),
    host: cookies.get('nh'),
    password: cookies.get('np'),
    spaces: [],
    currentSpace: '',
    edgeTypes: [],
    tags: [],
    tagsFields: [],
    edgesFields: [],
    indexes: [],
    tagsWithIndexInfo: [] as ITag[],
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },

    addEdgesName: (state: IState, payload: any) => {
      const { edgesFields } = state;
      const { edgeType, edgeFields } = payload;
      const index = _.findIndex(edgesFields, edgeType);
      if (index === -1) {
        edgesFields.push({
          [edgeType]: edgeFields,
        });
      } else {
        edgesFields[index] = {
          [edgeType]: edgeFields,
        };
      }
      return {
        ...state,
        edgesFields,
      };
    },

    addTagsName: (state: IState, payload: any) => {
      const { tagsFields } = state;
      const { tag, tagFields } = payload;
      const index = _.findIndex(tagsFields, tag);
      if (index === -1) {
        tagsFields.push({
          [tag]: tagFields,
        });
      } else {
        tagsFields[index] = {
          [tag]: tagFields,
        };
      }
      return {
        ...state,
        tagsFields,
      };
    },

    clearConfig: () => {
      cookies.remove('nh');
      cookies.remove('nu');
      cookies.remove('np');
      setTimeout(() => {
        window.location.href = '/config-server';
      });
    },
  },
  // TODO dispatch type interface
  effects: (dispatch: any) => ({
    async asyncConfigServer(payload: {
      host: string;
      username: string;
      password: string;
    }) {
      const { host, username, password } = payload;
      if (host.startsWith('http://')) {
        payload.host = host.substr(7);
      }
      if (host.startsWith('https://')) {
        payload.host = host.substr(8);
      }
      const { code, message: errorMessage } = (await service.connectDB({
        host,
        username,
        password,
      })) as any;
      if (code === 0) {
        trackEvent('connect', 'success');
        message.success(intl.get('configServer.success'));
        cookies.set('nh', host);
        cookies.set('nu', username);
        cookies.set('np', password);
        this.update({
          host,
          username,
          password,
        });
        return true;
      } else {
        trackEvent('connect', 'fail');
        message.error(`${intl.get('configServer.fail')}: ${errorMessage}`);
        this.update({
          host: '',
          username: '',
          password: '',
        });
        cookies.remove('nh');
        cookies.remove('nu');
        cookies.remove('np');
        return false;
      }
    },

    async asyncGetSpaces() {
      const { code, data } = (await service.execNGQL({
        gql: 'show spaces;',
      })) as any;
      if (code === 0) {
        this.update({
          spaces: data.tables.map(item => item.Name).sort(),
        });
      }
    },

    async asyncGetTags() {
      const { code, data } = (await service.execNGQL({
        gql: `
          SHOW TAGS;
        `,
      })) as any;

      if (code === 0) {
        this.update({
          tags: data.tables.map(item => item.Name),
        });
      }
      return { code, data };
    },

    async asyncGetTagsFields(payload: { tags: any[] }) {
      const { tags } = payload;
      await Promise.all(
        tags.map(async item => {
          const { code, data } = (await service.execNGQL({
            // HACK: Processing keyword
            gql: 'desc tag' + '`' + item + '`;',
          })) as any;
          if (code === 0) {
            const tagFields = data.tables.map(item => item.Field);
            this.addTagsName({ tag: item, tagFields });
          }
        }),
      );
    },

    async asyncGetEdgeTypesFields(payload: { edgeTypes: any[] }) {
      const { edgeTypes } = payload;
      await Promise.all(
        edgeTypes.map(async item => {
          const { code, data } = (await service.execNGQL({
            // HACK: Processing keyword
            gql: 'desc edge' + '`' + item + '`;',
          })) as any;
          if (code === 0) {
            const edgeFields = data.tables.map(item => item.Field);
            this.addEdgesName({
              edgeType: item,
              edgeFields: ['type', '_rank', ...edgeFields],
            });
          }
        }),
      );
    },

    async asyncGetEdgeTypes() {
      const { code, data } = (await service.execNGQL({
        gql: `
          show edges;
        `,
      })) as any;
      if (code === 0) {
        this.update({
          edgeTypes: data.tables.map(item => item.Name),
        });
      }
    },

    async asyncSwitchSpace(space: string) {
      const { code } = (await service.execNGQL({
        // HACK: Processing keyword
        gql: 'use' + '`' + space + '`;',
      })) as any;

      if (code === 0) {
        this.update({
          currentSpace: space,
        });
      }
    },

    async asyncGetTagIndexes() {
      const { code, data } = (await service.execNGQL({
        gql: `
          SHOW TAG INDEXES
        `,
      })) as any;
      if (code === 0) {
        const indexes = data.tables.map(item => {
          return {
            id: item['Index ID'],
            name: item['Index Name'],
          };
        });
        this.update({
          indexes,
        });
        return { code, indexes };
      }
      return { code, data };
    },

    async asyncGetTagWithIndex(name) {
      const { code, data } = (await service.execNGQL({
        gql: `
          SHOW CREATE TAG index ${name}
        `,
      })) as any;
      if (code === 0) {
        const res = (data.tables && data.tables[0]['Create Tag Index']) || '';
        const re = /.+\s+ON\s+`?(\w+)`?\((.+)\)/g;
        const tag = re.exec(res);
        return tag ? tag[1] : null;
      } else {
        return null;
      }
    },

    async asyncGetIndexFields(name) {
      const { code, data } = (await service.execNGQL({
        gql: `
          DESCRIBE TAG INDEX ${name}
        `,
      })) as any;
      return { code, data };
    },

    async asyncCombineTagList() {
      const { code, indexes } = await dispatch.nebula.asyncGetTagIndexes();
      if (code === 0) {
        const _indexes = await Promise.all(
          indexes.map(async (item: any) => {
            const { code, data } = await dispatch.nebula.asyncGetIndexFields(
              item.name,
            );
            return {
              indexName: item.name,
              props: code === 0 ? data.tables : [],
            };
          }),
        );
        const tags = [] as ITag[];
        await Promise.all(
          _indexes.map(async (item: any) => {
            const data = await dispatch.nebula.asyncGetTagWithIndex(
              item.indexName,
            );
            const tag = tags.filter(i => i.tagName === data);
            if (tag.length > 0) {
              tag[0].indexes.push(item);
            } else {
              tags.push({
                tagName: data,
                indexes: [item],
              });
            }
            return tags;
          }),
        );
        // Explain: tags format:
        /* [{  tagName: 'xxx',
             indexes: [{
               indexName: 'xxx',
               props: [{
                 Field: 'name',
                 Type: 'string'
               }]
             }]
          }] */
        this.update({
          tagsWithIndexInfo: tags,
        });
      }
    },
  }),
});
