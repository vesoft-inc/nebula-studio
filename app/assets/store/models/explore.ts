import { createModel } from '@rematch/core';
import { message } from 'antd';
import * as d3 from 'd3';
import _ from 'lodash';
import intl from 'react-intl-universal';

import service from '#assets/config/service';
import {
  fetchEdgeProps,
  fetchVertexProps,
  fetchVertexPropsWithIndex,
} from '#assets/utils/fetch';
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
    quantityLimit?: number;
  };
  preloadVertexes: string[];
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
      quantityLimit: null,
    },
    preloadVertexes: [],
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

    clear: () => {
      return {
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
        preloadVertexes: [],
      };
    },
  },
  effects: {
    async asyncImportNodes(payload: { ids: string; useHash?: string }) {
      const { ids, useHash } = payload;
      const newVertexes = await Promise.all(
        ids
          .trim()
          .split('\n')
          .map(async id => {
            const res = await fetchVertexProps(id, useHash);
            if (res.code === 0) {
              const nodeProp = res.data;
              if (nodeProp.headers.length && nodeProp.tables.length) {
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
                const vertexID =
                  nodeProp.tables.map(i => i.VertexID)[0] || null;
                return {
                  name: vertexID,
                  nodeProp,
                  step: 0,
                  group: tags.join('-'),
                };
              } else {
                message.warning(`${id}${intl.get('import.notExist')}`);
              }
            } else {
              message.warning(res.message);
            }
          }),
      );
      const uniqVertexes = _.uniqBy(newVertexes, 'name');
      this.addNodesAndEdges({
        vertexes: uniqVertexes.filter(v => v !== undefined),
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
      edgesFields: any[];
      edgeDirection: string;
      filters: any[];
      exploreStep: number;
      vertexColor: string;
      quantityLimit: number | null;
      originVertexes: any[];
      originEdges: any[];
    }) {
      const {
        selectVertexes,
        edgeTypes,
        edgesFields,
        edgeDirection,
        filters,
        exploreStep,
        vertexColor,
        quantityLimit,
        originVertexes,
        originEdges,
      } = payload;
      let group;
      const gql = getExploreGQL({
        selectVertexes,
        edgeTypes,
        edgeDirection,
        filters,
        quantityLimit,
      });
      const { code, data, message } = (await service.execNGQL({
        gql,
      })) as any;

      if (code === 0 && data.tables.length !== 0) {
        const { edges, vertexes } = nebulaToData(
          idToSrting(data.tables),
          edgeTypes,
          edgeDirection,
        );
        // fetch vertexes
        const newVertexes = await Promise.all(
          _.differenceBy(vertexes, originVertexes, vertexe => vertexe.name).map(
            async (v: any) => {
              const res = await fetchVertexProps(v.name);
              const nodeProp = res.data;
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
            },
          ),
        );
        // fetch edges
        const newEdges = await Promise.all(
          _.differenceBy(edges, originEdges, edge => edge.id).map(
            async (e: any) => {
              const edgeFields = _.find(edgesFields, e.type);
              const edgeProp = await fetchEdgeProps({
                id: e.id,
                type: e.type,
                edgeFields,
              });
              return {
                ...e,
                edgeProp,
              };
            },
          ),
        );
        this.addNodesAndEdges({
          vertexes: newVertexes,
          edges: newEdges,
        });
        this.update({
          step: exploreStep,
        });
      } else {
        throw new Error(message);
      }
    },
    async asyncImportNodesWithIndex(payload: {
      tag: string;
      filters: any[];
      quantityLimit: number | null;
    }) {
      const { code, data, message } = await fetchVertexPropsWithIndex(payload);
      if (code === 0 && data.tables.length !== 0) {
        const ids = data.tables && data.tables.map(i => i.VertexID).join('\n');
        this.asyncImportNodes({ ids });
      } else {
        throw new Error(message);
      }
    },
  },
});
