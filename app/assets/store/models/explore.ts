import { createModel } from '@rematch/core';

import service from '#assets/config/service';

interface IState {
  vertexs: any[];
  edges: any[];
}

export const explore = createModel({
  state: {
    vertexs: [
      { name: '200', group: 1 },
      { name: '201', group: 2 },
      { name: '202', group: 4 },
      { name: '203', group: 3 },
      { name: '205', group: 4 },
    ],
    edges: [
      { source: '200', target: '201', value: 3, type: 'like' },
      { source: '200', target: '202', value: 5, type: 'like' },
      { source: '202', target: '205', value: 5, type: 'like' },
      { source: '200', target: '205', value: 8, type: 'like' },
      { source: '203', target: '201', value: 8, type: 'like' },
    ],
    ids: [],
  },
  reducers: {
    update: (state: IState, payload: object): IState => {
      return {
        ...state,
        ...payload,
      };
    },
  },
  effects: {
    async asyncGetExpand(payload: {
      host: string;
      username: string;
      password: string;
      space: string;
      ids: any;
      edgetype: string;
    }) {
      const { host, username, password, space, ids, edgetype } = payload;
      const { code, data } = (await service.execNGQL({
        host,
        username,
        password,
        gql: `
          use ${space};
          GO FROM ${ids} OVER ${edgetype} yield ${edgetype}._src as sourceid, ${edgetype}._dst as destid;;
        `,
      })) as any;
      if (code === '0') {
        console.log(data);
      }
    },
  },
});
