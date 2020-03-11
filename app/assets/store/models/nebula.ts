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
  tagsName: any[];
}

export const nebula = createModel({
  state: {
    spaces: [],
    host: cookies.get('host'),
    username: cookies.get('username'),
    password: cookies.get('password'),
    currentSpace: '',
    edgeTypes: [],
    tags: [],
    tagsName: [],
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },

    addTagsName: (state: IState, payload: any) => {
      const { tagsName } = state;
      const { tag, Names } = payload;
      const index = _.findIndex(tagsName, tag);
      if (index === -1) {
        tagsName.push({
          [tag]: Names,
        });
      } else {
        tagsName[index] = {
          [tag]: Names,
        };
      }
      return {
        ...state,
        tagsName,
      };
    },

    asyncClearConfig: (state: IState) => {
      cookies.remove('host');
      cookies.remove('username');
      cookies.remove('password');
      return {
        ...state,
        host: '',
        username: '',
        password: '',
      };
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
      const { code, message: errorMessage } = (await service.connectDB(
        payload,
      )) as any;
      if (code === '0') {
        cookies.set('host', payload.host);
        cookies.set('username', username);
        cookies.set('password', password);
        trackEvent('connect', 'success');
        this.update({
          host: payload.host,
          username,
          password,
        });
        message.success(intl.get('configServer.success'));
        return true;
      } else {
        trackEvent('connect', 'fail');
        message.error(`${intl.get('configServer.fail')}: ${errorMessage}`);
        return false;
      }
    },

    async asyncGetSpaces(payload: {
      host: string;
      username: string;
      password: string;
    }) {
      const { host, username, password } = payload;
      const { code, data } = (await service.execNGQL({
        host,
        username,
        password,
        gql: 'show spaces;',
      })) as any;
      if (code === '0') {
        this.update({
          spaces: data.tables.map(item => item.Name).sort(),
        });
      }
    },

    async asyncGetTags(payload: {
      host: string;
      username: string;
      password: string;
      space: string;
    }) {
      const { host, username, password, space } = payload;
      const { code, data } = (await service.execNGQL({
        host,
        username,
        password,
        gql: `
          use ${space};
          SHOW TAGS;
        `,
      })) as any;

      if (code === '0') {
        this.update({
          tags: data.tables.map(item => item.Name),
        });
      }
    },

    async asyncGetTagsName(payload: {
      host: string;
      username: string;
      password: string;
      space: string;
    }) {
      const { host, username, password, space } = payload;
      const { code, data } = (await service.execNGQL({
        host,
        username,
        password,
        gql: `
          use ${space};
          SHOW TAGS;
        `,
      })) as any;
      if (code === '0') {
        await Promise.all(
          data.tables.map(async item => {
            const { code, data } = (await service.execNGQL({
              host,
              username,
              password,
              gql: `
            use ${space};
            desc tag ${item.Name};
          `,
            })) as any;
            if (code === '0') {
              const Names = data.tables.map(item => item.Field);
              this.addTagsName({ tag: item.Name, Names });
            }
          }),
        );
      }
    },

    async asyncGetEdgeTypes(payload: {
      host: string;
      username: string;
      password: string;
      space: string;
    }) {
      const { host, username, password, space } = payload;
      const { code, data } = (await service.execNGQL({
        host,
        username,
        password,
        gql: `
          use ${space};
          show edges;
        `,
      })) as any;
      if (code === '0') {
        this.update({
          edgeTypes: data.tables.map(item => item.Name),
        });
      }
    },
  },
});
