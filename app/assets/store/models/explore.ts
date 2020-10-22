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
  type: string;
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
function getTagData(nodeProps, expand) {
  if (nodeProps.headers.length && nodeProps.tables.length) {
    let group;
    if (expand && expand.vertexColor !== 'groupByTag') {
      group = 'step-' + expand.exploreStep;
    } else {
      const tags =
        nodeProps && nodeProps.headers
          ? _.sortedUniq(
              nodeProps.headers.map(field => {
                if (field === 'VertexID') {
                  return 't';
                } else {
                  return field.split('.')[0];
                }
              }),
            )
          : [];
      group = tags.join('-');
    }
    const vertexes = nodeProps.tables.map(item => {
      const nodeProp = {
        headers: nodeProps.headers,
        tables: [item],
      };
      if (expand) {
        return {
          name: item.VertexID,
          nodeProp,
          group,
        };
      } else {
        return {
          name: item.VertexID,
          step: 0,
          group,
          nodeProp,
        };
      }
    });
    return vertexes;
  } else {
    return [];
  }
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
        edges: _.differenceBy(
          addEdges,
          originEdges,
          v => '`' + v.type + '`' + v.id,
        ),
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
  effects: (dispatch: any) => ({
    async asyncGetVertexes(payload: {
      ids: string[];
      useHash?: string;
      expand?: {
        vertexColor: string;
        exploreStep;
      };
    }) {
      const { ids, useHash, expand } = payload;
      let newVertexes: any = [];
      if (ids.length === 1) {
        const nodeData = await fetchVertexProps({ ids, useHash });
        if (nodeData.code === 0) {
          newVertexes = getTagData(nodeData.data, expand);
        }
      } else if (ids.length > 1) {
        const tagData = await dispatch.nebula.asyncGetTags();
        const tags = tagData.code === 0 ? tagData.data.map(i => i.Name) : [];
        const tagNodes = await Promise.all(
          tags.map(async tag => {
            const nodesData = await fetchVertexProps({ ids, useHash, tag });
            return nodesData.code === 0
              ? getTagData(nodesData.data, expand)
              : undefined;
          }),
        );
        const flattenVertexes = _.flatten(tagNodes).filter(
          i => i !== undefined,
        );
        const vertexTags: any = {};
        flattenVertexes.forEach((item: any) => {
          const id = item.name;
          if (vertexTags[id]) {
            const { headers, tables } = vertexTags[id].nodeProp;
            const data = tables[0];
            const nodeProp = {
              headers: _.union(headers, item.nodeProp.headers),
              tables: [_.assign(data, item.nodeProp.tables[0])],
            };
            vertexTags[id].nodeProp = nodeProp;
          } else {
            vertexTags[id] = item;
          }
        });
        newVertexes = Object.values(vertexTags);
      }
      return newVertexes;
    },

    async asyncImportNodes(payload: { idsText: string; useHash?: string }) {
      const { idsText, useHash } = payload;
      const ids = idsText.trim().split('\n');
      const newVertexes: any =
        ids.length > 0
          ? await this.asyncGetVertexes({
              ids,
              useHash,
            })
          : [];
      const newIds = newVertexes.map(i => i.name);
      if (newIds.length !== ids.length) {
        const notExistIds = _.xor(newIds, ids);
        message.warning(
          `${notExistIds.join(', ')}${intl.get('import.notExist')}`,
        );
      }
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
        edges: _.differenceBy(
          edges,
          originEdges,
          v => '`' + v.type + '`' + v.id,
        ),
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
        const uniqVertexes = _.differenceBy(
          vertexes,
          originVertexes,
          vertex => vertex.name,
        );
        const uniqIds = uniqVertexes.map((i: any) => i.name);
        const newVertexes =
          uniqIds.length > 0
            ? await this.asyncGetVertexes({
                ids: uniqIds,
                expand: {
                  vertexColor,
                  exploreStep,
                },
              })
            : [];
        // fetch edges
        const uniqEdges = _.differenceBy(
          edges,
          originEdges,
          edge => '`' + edge.type + '`' + edge.id,
        );
        const edgeTypeGroup = _.groupBy(uniqEdges, (edge: any) => edge.type);
        const edgeList = await Promise.all(
          Object.keys(edgeTypeGroup).map(async type => {
            const idRoutes = edgeTypeGroup[type].map((i: any) => i.id);
            const edgeFields = _.find(edgesFields, type);
            const res = await fetchEdgeProps({
              idRoutes,
              type,
              edgeFields,
            });
            const _edges = res.tables.map(item => {
              const edgeProp = {
                headers: res.headers,
                tables: [item],
              };
              return {
                source: item[`${type}._src`],
                target: item[`${type}._dst`],
                id: `${item[`${type}._src`]}->${item[`${type}._dst`]}@${
                  item[`${type}._rank`]
                }`,
                type,
                edgeProp,
              };
            });
            return _edges;
          }),
        );
        const newEdges = _.flatten(edgeList);
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
        const idsText =
          data.tables && data.tables.map(i => i.VertexID).join('\n');
        this.asyncImportNodes({ idsText });
      } else {
        throw new Error(message);
      }
    },
  }),
});
