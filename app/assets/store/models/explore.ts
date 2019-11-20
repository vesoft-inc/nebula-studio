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
      const {
        vertexes: originVertexes,
        edges: originEdges,
        selectVertexes,
      } = state;
      const { vertexes: addVertexes, edges: addEdges } = payload;
      addVertexes.map(d => {
        d.x = _.meanBy(selectVertexes, 'x') || window.screen.width / 2;
        d.y = _.meanBy(selectVertexes, 'y') || window.screen.height / 2;
      });
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
      selectVertexes: any[];
      edgeType: string;
      filters: any[];
    }) {
      const {
        host,
        username,
        password,
        space,
        selectVertexes,
        edgeType,
        filters,
      } = payload;
      const wheres = filters
        .filter(filter => filter.field && filter.operator && filter.value)
        .map(filter => `${filter.field} ${filter.operator} ${filter.value}`)
        .join(' AND ');
      const gql = `
        use ${space};
        GO FROM ${selectVertexes.map(d => d.name)} OVER ${edgeType} ${
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
