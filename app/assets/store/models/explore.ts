import { createModel } from '@rematch/core';
import _ from 'lodash';

import service from '#assets/config/service';

import { idToSrting, nebulaToData } from '../../utils/nebulaToData';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

interface IState {
  vertexes: INode[];
  edges: any[];
  selectVertexes: INode[];
}

export const explore = createModel({
  state: {
    vertexes: [],
    edges: [],
    selectVertexes: [],
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
      addVertexes.map(d => {
        d.x = 500;
        d.y = 600;
      });
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
      selectVertexes: INode[];
      edgetype: string;
    }) {
      const {
        host,
        username,
        password,
        space,
        selectVertexes,
        edgetype,
      } = payload;
      const { code, data } = (await service.execNGQL({
        host,
        username,
        password,
        gql: `
          use ${space};
          GO FROM ${selectVertexes.map(
            d => d.name,
          )} OVER ${edgetype} yield ${edgetype}._src as sourceid, ${edgetype}._dst as destid;
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
