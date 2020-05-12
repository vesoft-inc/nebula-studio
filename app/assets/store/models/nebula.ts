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
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },

    addTagsName: (state: IState, payload: any) => {
      const { tagsFields } = state;
      const { tag, Names } = payload;
      const index = _.findIndex(tagsFields, tag);
      if (index === -1) {
        tagsFields.push({
          [tag]: Names,
        });
      } else {
        tagsFields[index] = {
          [tag]: Names,
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
  effects: {
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
      if (code === '0') {
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
      if (code === '0') {
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

      if (code === '0') {
        this.update({
          tags: data.tables.map(item => item.Name),
        });
      }
      return { code, data };
    },

    async asyncGetTagsName(payload: { tags: any[] }) {
      const { tags } = payload;
      await Promise.all(
        tags.map(async item => {
          const { code, data } = (await service.execNGQL({
            gql: `desc tag ${item};`,
          })) as any;
          if (code === '0') {
            const Names = data.tables.map(item => item.Field);
            this.addTagsName({ tag: item, Names });
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
      if (code === '0') {
        this.update({
          edgeTypes: data.tables.map(item => item.Name),
        });
      }
    },

    async asyncSwitchSpace(space: string) {
      const { code } = (await service.execNGQL({
        gql: `use ${space};`,
      })) as any;

      if (code === '0') {
        this.update({
          currentSpace: space,
        });
      }
    },
  },
});
