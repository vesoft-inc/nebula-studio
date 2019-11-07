import { createModel } from '@rematch/core';
import cookies from 'js-cookie';

import service from '#assets/config/service';
// import { IDispatch } from '#assets/store'

interface IState {
  spaces: string[];
  currentSpace: string;
  edgeTypes: string[];
  host: string;
  username: string;
  password: string;
}

export const nebula = createModel({
  state: {
    spaces: [],
    host: cookies.get('host'),
    username: cookies.get('username'),
    password: cookies.get('password'),
    currentSpace: '',
    edgeTypes: [],
  },
  reducers: {
    update: (state: IState, payload: any) => {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: {
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
          spaces: data.tables.map(item => item.Name),
        });
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
