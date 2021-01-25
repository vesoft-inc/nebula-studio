import { createModel } from '@rematch/core';
import { message } from 'antd';
import * as d3 from 'd3';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { v4 as uuidv4 } from 'uuid';

import service from '#assets/config/service';
import {
  fetchEdgeProps,
  fetchVertexProps,
  fetchVertexPropsWithIndex,
} from '#assets/utils/fetch';
import { handleVidStringName } from '#assets/utils/function';
import { getExploreGQL } from '#assets/utils/gql';
import { nebulaToData, setLink } from '#assets/utils/nebulaToData';

export interface INode extends d3.SimulationNodeDatum {
  name: string;
  group?: number;
  uuid: string;
}

export interface IEdge extends d3.SimulationLinkDatum<INode> {
  id: string;
  source: INode;
  target: INode;
  size: number;
  type: string;
  uuid: string;
}

interface IExportEdge {
  srcId: string;
  dstId: string;
  rank: string;
  edgeType: string;
}

interface IExportData {
  vertexes: string[];
  edges: IExportEdge[];
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
  preloadData: IExportData;
  showTagFields: string[];
  showEdgeFields: string[];
}

function getGroup(tags, expand) {
  if (expand && expand.vertexColor !== 'groupByTag') {
    return 'step-' + expand.exploreStep;
  } else {
    return 't-' + tags.sort().join('-');
  }
}

function getTagData(nodes, expand) {
  const data = nodes.map(node => {
    const { vid, tags, properties } = node;
    const group = getGroup(tags, expand);
    const nodeProp = {
      tags,
      properties,
    };
    const uuid = uuidv4();
    return {
      name: vid,
      nodeProp,
      group,
      uuid,
    };
  });
  return data;
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
    preloadData: {
      vertexes: [],
      edges: [],
    },
    showTagFields: [],
    showEdgeFields: [],
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
        preloadData: {
          vertexes: [],
          edges: [],
        },
        showTagFields: [],
        showEdgeFields: [],
      };
    },
  },
  effects: () => ({
    async asyncGetVertexes(payload: {
      ids: string[];
      expand?: {
        vertexColor: string;
        exploreStep;
      };
    }) {
      const { ids, expand } = payload;
      const res = await fetchVertexProps({ ids });
      const newVertexes = res.code === 0 ? getTagData(res.data, expand) : [];
      return newVertexes;
    },

    async asyncImportNodes(payload: { ids: string[] }) {
      const { ids } = payload;
      const vertexes = await this.asyncGetExploreVertex({ ids });
      this.addNodesAndEdges({
        vertexes,
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
            v.source.uuid === selectVertexe.uuid ||
            v.target.uuid === selectVertexe.uuid,
        );
      });
      const vertexes = _.differenceBy(
        originVertexes,
        selectVertexes,
        v => v.uuid,
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
    }) {
      const { edgesFields, exploreStep, vertexColor } = payload;
      const { vertexes, edges } = (await this.asyncGetExpandData(
        payload,
      )) as any;
      await this.asyncAddGraph({
        edges,
        vertexes,
        expand: {
          vertexColor,
          exploreStep,
          edgesFields,
        },
      });
    },

    async asyncImportNodesWithIndex(payload: {
      tag: string;
      filters: any[];
      quantityLimit: number | null;
    }) {
      const { code, data, message } = await fetchVertexPropsWithIndex(payload);
      if (code === 0 && data.tables.length !== 0) {
        const ids = data.tables && data.tables.map(i => i.VertexID || i._vid);
        this.asyncImportNodes({ ids });
      } else {
        throw new Error(message);
      }
    },

    async asyncGetExploreVertex(payload: { ids: string[] }) {
      const { ids } = payload;
      const _ids = _.uniq(ids);
      const vertexes: any =
        _ids.length > 0
          ? await this.asyncGetVertexes({
              ids: _ids,
            })
          : [];
      const newIds = vertexes.map(i => i.name);
      if (newIds.length !== _ids.length) {
        const notExistIds = _.xor(newIds, _ids);
        message.warning(
          `${notExistIds.join(', ')}${intl.get('import.notExist')}`,
        );
      }
      return _.uniqBy(vertexes, 'name').filter(i => i !== undefined);
    },

    async asyncGetExploreEdge(edgeList: IExportEdge[]) {
      let _edges = [];
      if (edgeList.length > 0) {
        const type = edgeList[0].edgeType;
        const res = await fetchEdgeProps({
          idRoutes: edgeList.map(
            i =>
              `${handleVidStringName(i.srcId)}->${handleVidStringName(
                i.dstId,
              )}@${i.rank}`,
          ),
          type,
        });
        _edges = res.tables.map(item => {
          const edgeProp = {
            properties: item.properties,
          };
          return {
            source: item.srcID,
            target: item.dstID,
            id: `${type} ${item.srcID}->${item.dstID} @${item.rank}`,
            type,
            rank: item.rank,
            edgeProp,
            uuid: uuidv4(),
          };
        });
      }
      return _edges;
    },

    async asyncGetExploreInfo(data: IExportData) {
      const { vertexes, edges } = data;
      const _vertexes = await this.asyncGetExploreVertex({ ids: vertexes });
      let _edges: any = _.groupBy(edges, e => e.edgeType);
      _edges = await Promise.all(
        Object.values(_edges).map(async item => {
          return this.asyncGetExploreEdge(item);
        }),
      );
      this.addNodesAndEdges({
        vertexes: _vertexes,
        edges: _edges.flat(),
      });
    },

    async asyncBidirectExpand(_payload, rootState) {
      const {
        nebula: { edgeTypes },
        explore: { selectVertexes },
      } = rootState;
      let vertexes = [] as any;
      let edges = [] as any;
      const {
        vertexes: incomingV,
        edges: incomingE,
      } = (await this.asyncGetExpandData({
        selectVertexes,
        edgeTypes,
        edgeDirection: 'incoming',
      })) as any;
      const {
        vertexes: outgoingV,
        edges: outgoingE,
      } = (await this.asyncGetExpandData({
        selectVertexes,
        edgeTypes,
        edgeDirection: 'outgoing',
      })) as any;
      vertexes = [...vertexes, ...incomingV, ...outgoingV];
      edges = [...edges, ...incomingE, ...outgoingE];
      await this.asyncAddGraph({
        vertexes,
        edges,
      });
    },

    async asyncGetExpandData(payload: {
      selectVertexes: any[];
      edgeTypes: string[];
      edgesFields?: any[];
      edgeDirection: string;
      filters?: any[];
      exploreStep?: number;
      vertexColor?: string;
      quantityLimit?: number | null;
    }) {
      const {
        selectVertexes,
        edgeTypes,
        edgeDirection,
        filters,
        quantityLimit,
      } = payload;
      const gql = getExploreGQL({
        selectVertexes,
        edgeTypes,
        edgeDirection,
        filters,
        quantityLimit,
      });
      const { code, data, message: errMsg } = (await service.execNGQL({
        gql,
      })) as any;
      if (code === 0) {
        const { vertexes, edges } = nebulaToData(
          data.tables,
          edgeTypes,
          edgeDirection,
        );
        return {
          vertexes,
          edges,
        };
      } else {
        message.warning(errMsg);
        return {
          vertexes: [],
          edges: [],
        };
      }
    },

    async asyncAddGraph(
      payload: {
        vertexes;
        edges;
        expand;
      },
      rootState,
    ) {
      const {
        explore: { vertexes: originVertexes, edges: originEdges },
      } = rootState;
      const { vertexes, edges, expand } = payload;
      // fetch vertexes
      const newVertexes = _.differenceBy(
        vertexes,
        originVertexes,
        (vertex: any) => vertex.name,
      );
      const newIds = _.uniq(newVertexes.map((i: any) => i.name));
      const _newVertexes =
        newIds.length > 0
          ? await this.asyncGetVertexes({
              ids: newIds,
              expand,
            })
          : [];
      // fetch edges
      const newEdges = _.differenceBy(
        edges,
        originEdges,
        (edge: any) => '`' + edge.type + '`' + edge.id,
      );
      const edgeTypeGroup = _.groupBy(newEdges, (edge: any) => edge.type);
      const edgeList = await Promise.all(
        Object.keys(edgeTypeGroup).map(async type => {
          const idRoutes = edgeTypeGroup[type].map((i: any) => i.id);
          const edgeFields =
            expand && expand.edgeFields
              ? _.find(expand.edgesFields, type)
              : null;
          const res = await fetchEdgeProps({
            idRoutes,
            type,
            edgeFields,
          });
          const _edges = res.tables.map(item => {
            const edgeProp = {
              properties: item.properties,
            };
            return {
              source: item.srcID,
              target: item.dstID,
              id: `${type} ${item.srcID}->${item.dstID} @${item.rank}`,
              type,
              rank: item.rank,
              edgeProp,
              uuid: uuidv4(),
            };
          });
          return _edges;
        }),
      );
      const _newEdges = _.flatten(edgeList);
      this.addNodesAndEdges({
        vertexes: _newVertexes,
        edges: _newEdges,
      });
      if (expand && expand.exploreStep) {
        this.update({
          step: expand.exploreStep,
        });
      }
    },
  }),
});
