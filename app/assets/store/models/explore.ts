import { createModel } from '@rematch/core';

import service from '#assets/config/service';

import NebulaToD3Data from '../../utils/nebulaToData';

interface IState {
  vertexs: any[];
  edges: any[];
}

export const explore = createModel({
  state: {
    vertexs: [],
    edges: [],
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
    async asyncGetExpand(
      payload: {
        host: string;
        username: string;
        password: string;
        space: string;
        ids: any[];
        edgetype: string;
      },
      state,
    ) {
      const { host, username, password, space, ids, edgetype } = payload;
      const { code, data } = (await service.execNGQL({
        host,
        username,
        password,
        gql: `
          use ${space};
          GO FROM ${ids} OVER ${edgetype} yield ${edgetype}._src as sourceid, ${edgetype}._dst as destid;
        `,
      })) as any;
      if (code === '0' && data.tables.length !== 0) {
        const d3data = NebulaToD3Data(state.explore.vertexs, data, edgetype);
        const edges = state.explore.edges.concat(d3data.edges);
        const vertexs = d3data.vertexs;
        this.update({
          vertexs,
          edges,
        });
      }
    },
  },
});
