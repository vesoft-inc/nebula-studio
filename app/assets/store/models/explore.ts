import { createModel } from '@rematch/core';
import { message } from 'antd';
import * as d3 from 'd3';
import _ from 'lodash';
import intl from 'react-intl-universal';

import service from '#assets/config/service';
import { fetchVertexProps } from '#assets/utils/fetch';
import { getExploreGQL } from '#assets/utils/gql';
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
    edgeTypes?: string[];
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
      edgeTypes: [],
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
    async asyncImportNodes(payload: { ids: string }) {
      const { ids } = payload;
      const newVertexes = await Promise.all(
        ids
          .trim()
          .split('\n')
          .map(async id => {
            const nodeProp = await fetchVertexProps(id);
            if (nodeProp.headers.length) {
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
            } else {
              message.warning(`${id}${intl.get('import.notExist')}`);
            }
          }),
      );
      this.addNodesAndEdges({
        vertexes: newVertexes.filter(v => v !== undefined),
        edges: [],
      });
    },

    async deleteNodesAndEdges(payload: {
      selectVertexes: any[];
      vertexes: INode[];
      edges: IEdge[];
      actionData: any[];
    }) {
      const {
        vertexes: originVertexes,
        edges,
        selectVertexes,
        actionData,
      } = payload;
      const originEdges = [...edges];
      selectVertexes.forEach(selectVertexe => {
        _.remove(
          originEdges,
          v =>
            v.source.name === selectVertexe.name ||
            v.target.name === selectVertexe.name,
        );
      });
      const vertexes = _.differenceBy(
        originVertexes,
        selectVertexes,
        v => v.name,
      );
      actionData.push({
        type: 'REMOVE',
        vertexes: selectVertexes,
        edges: _.differenceBy(edges, originEdges, v => v.id),
      });
      this.update({
        vertexes,
        edges: originEdges,
        actionData,
        selectVertexes: [],
      });
    },

    async asyncGetExpand(payload: {
      selectVertexes: any[];
      edgeTypes: string[];
      edgeDirection: string;
      filters: any[];
      exploreStep: number;
      vertexColor: string;
    }) {
      const {
        selectVertexes,
        edgeTypes,
        edgeDirection,
        filters,
        exploreStep,
        vertexColor,
      } = payload;
      let group;
      const gql = getExploreGQL({
        selectVertexes,
        edgeTypes,
        edgeDirection,
        filters,
      });
      const { code, data, message } = (await service.execNGQL({
        gql,
      })) as any;

      if (code === '0' && data.tables.length !== 0) {
        const { edges, vertexes } = nebulaToData(
          idToSrting(data.tables),
          edgeTypes,
          edgeDirection,
        );
        const newVertexes = await Promise.all(
          vertexes.map(async v => {
            const nodeProp = await fetchVertexProps(v.name);
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
