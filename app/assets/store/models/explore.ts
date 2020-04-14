import { createModel } from '@rematch/core';
import * as d3 from 'd3';
import _ from 'lodash';

import service from '#assets/config/service';
import { fetchVertexProps } from '#assets/utils/fetch';
import { idToSrting, nebulaToData, setLink } from '#assets/utils/nebulaToData';

export interface INode extends d3.SimulationNodeDatum {
  name: string;
  group?: number;
}

export interface IEdge extends d3.SimulationLinkDatum<INode> {
  id: string;
  source: INode;
  target: INode;
  size: number;
}

interface IState {
  vertexes: INode[];
  edges: IEdge[];
  selectVertexes: INode[];
  actionData: any[];
  step: number;
  exploreRules: {
    edgeType?: string;
    edgeDirection?: string;
    vertexColor?: string;
  };
}

export const explore = createModel({
  state: {
    vertexes: [],
    edges: [],
    selectVertexes: [],
    actionData: [],
    step: 0,
    exploreRules: {
      edgeType: '',
      edgeDirection: '',
      vertexColor: '',
    },
  },
  reducers: {
    update: (state: IState, payload: any): IState => {
      if (payload.edges) {
        setLink(payload.edges);
      }
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
        actionData,
      } = state;
      const { vertexes: addVertexes, edges: addEdges } = payload;

      const svg: any = d3.select('.output-graph');
      addVertexes.map(d => {
        d.x =
          _.meanBy(selectVertexes, 'x') ||
          svg.node().getBoundingClientRect().width / 2;
        d.y =
          _.meanBy(selectVertexes, 'y') ||
          svg.node().getBoundingClientRect().height / 2;
      });
      const edges = _.uniqBy([...originEdges, ...addEdges], e => e.id);
      setLink(edges);
      const vertexes = _.uniqBy(
        [...originVertexes, ...addVertexes],
        v => v.name,
      );
      actionData.push({
        type: 'ADD',
        vertexes: _.differenceBy(addVertexes, originVertexes, v => v.name),
        edges: _.differenceBy(addEdges, originEdges, v => v.id),
      });
      return {
        ...state,
        edges,
        vertexes,
        actionData,
      };
    },
  },
  effects: {
    async asyncImportNodes(payload: {
      host: string;
      username: string;
      password: string;
      space: string;
      ids: string;
    }) {
      const { host, username, password, space, ids } = payload;
      const newVertexes = await Promise.all(
        ids
          .trim()
          .split('\n')
          .map(async id => {
            const nodeProp = await fetchVertexProps(
              { space, host, username, password },
              id,
            );
            const tags =
              nodeProp && nodeProp.headers
                ? _.sortedUniq(
                    nodeProp.headers.map(field => {
                      if (field === 'VertexID') {
                        return 't';
                      } else {
                        return field.split('.')[0];
                      }
                    }),
                  )
                : [];

            return {
              name: id,
              nodeProp,
              step: 0,
              group: tags.join('-'),
            };
          }),
      );
      this.addNodesAndEdges({
        vertexes: newVertexes,
        edges: [],
      });
    },

    async asyncGetExpand(payload: {
      host: string;
      username: string;
      password: string;
      space: string;
      selectVertexes: any[];
      edgeType: string;
      edgeDirection: string;
      filters: any[];
      exploreStep: number;
      vertexColor: string;
    }) {
      const {
        host,
        username,
        password,
        space,
        selectVertexes,
        edgeType,
        edgeDirection,
        filters,
        exploreStep,
        vertexColor,
      } = payload;
      const wheres = filters
        .filter(filter => filter.field && filter.operator && filter.value)
        .map(filter => `${filter.field} ${filter.operator} ${filter.value}`)
        .join(' AND ');
      let direction;
      let group;
      switch (edgeDirection) {
        case 'incoming':
          direction = 'REVERSELY';
          break;
        default:
          direction = ''; // default outgoing
      }
      const gql = `
        use ${space};
        GO FROM ${selectVertexes.map(
          d => d.name,
        )} OVER ${edgeType} ${direction} ${
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
          edgeDirection,
        );
        const newVertexes = await Promise.all(
          vertexes.map(async v => {
            const nodeProp = await fetchVertexProps(
              { space, host, username, password },
              v.name,
            );
            if (vertexColor === 'groupByTag') {
              const tags =
                nodeProp && nodeProp.headers
                  ? _.sortedUniq(
                      nodeProp.headers.map(field => {
                        if (field === 'VertexID') {
                          return 't';
                        } else {
                          return field.split('.')[0];
                        }
                      }),
                    )
                  : [];
              group = tags.join('-');
            } else {
              group = 'step-' + exploreStep;
            }

            return {
              ...v,
              nodeProp,
              group,
            };
          }),
        );
        this.addNodesAndEdges({
          vertexes: newVertexes,
          edges,
        });
        this.update({
          step: exploreStep,
        });
      } else {
        throw new Error(message);
      }
    },
  },
});
