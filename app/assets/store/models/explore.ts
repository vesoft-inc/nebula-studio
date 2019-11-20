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
      const edges = _.uniqBy([...originEdges, ...addEdges], e => e.id);
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
      edgeType: string;
      filters: any[];
    }) {
      const {
        host,
        username,
        password,
        space,
        ids,
        edgeType,
        filters,
      } = payload;
      const wheres = filters
        .filter(filter => filter.field && filter.operator && filter.value)
        .map(filter => `${filter.field} ${filter.operator} ${filter.value}`)
        .join(' AND ');
      const gql = `
        use ${space};
        GO FROM ${ids} OVER ${edgeType} ${
        wheres ? `WHERE ${wheres}` : ''
      } yield ${edgeType}._src as sourceId, ${edgeType}._dst as destId, ${edgeType}._rank as rank;
      `;
      const { code, data, message } = (await service.execNGQL({
        host,
        username,
        password,
        gql,
      })) as any;

      if (code === '0' && data.tables.length !== 0) {
        const { edges, vertexes } = nebulaToData(
          idToSrting(data.tables),
          edgeType,
        );

        this.addNodesAndEdges({
          vertexes,
          edges,
        });
      } else {
        throw new Error(message);
      }
    },
  },
});
