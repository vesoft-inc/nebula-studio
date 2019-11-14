import { createModel } from '@rematch/core';
import _ from 'lodash';

import service from '#assets/config/service';

import { idToSrting, nebulaToData } from '../../utils/nebulaToData';

interface IState {
  vertexes: any[];
  edges: any[];
}

export const explore = createModel({
  state: {
    vertexes: [],
    edges: [],
    selectIds: [],
  },
  reducers: {
    update: (state: IState, payload: object): IState => {
      return {
        ...state,
        ...payload,
      };
    },
    addNodesAndEdges: (state: IState, payload: IState): IState => {
      const { vertexes: originVertexes, edges: originEdges } = state;
      const { vertexes: addVertexes, edges: addEdges } = payload;
      const edges = [...originEdges, ...addEdges];
      const vertexes = _.uniqBy(
        [...originVertexes, ...addVertexes],
        v => v.name,
      );

      return {
        ...state,
        edges,
        vertexes,
      };
    },
  },
  effects: {
    async asyncGetExpand(payload: {
      host: string;
      username: string;
      password: string;
      space: string;
      ids: any[];
      edgetype: string;
    }) {
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
        const { edges, vertexes } = nebulaToData(
          idToSrting(data.tables),
          edgetype,
        );

        this.addNodesAndEdges({
          vertexes,
          edges,
        });
      }
    },
  },
});
