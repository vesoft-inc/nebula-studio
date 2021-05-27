import { createModel } from '@rematch/core';
import { message } from 'antd';
import * as d3 from 'd3';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { v4 as uuidv4 } from 'uuid';

import {
  DEFAULT_COLOR_PICK_LIST,
  DEFAULT_EXPLORE_RULES,
} from '#assets/config/explore';
import service from '#assets/config/service';
import {
  fetchBidirectVertexes,
  fetchEdgeProps,
  fetchVertexProps,
  fetchVertexPropsWithIndex,
} from '#assets/utils/fetch';
import {
  convertBigNumberToString,
  handleVidStringName,
} from '#assets/utils/function';
import { getExploreMatchGQL, getPathGQL } from '#assets/utils/gql';
import { INode, IPath } from '#assets/utils/interface';
import { parsePathToGraph, setLink } from '#assets/utils/parseData';

function getBidrectVertexIds(data) {
  const { tables } = data;
  // go from nqgl return [{*._dst: id}]
  const ids = _.uniq(
    tables
      .map(row => {
        return Object.values(row);
      })
      .flat(),
  )
    .filter(id => id !== 0)
    .map(id => String(id));
  return ids;
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

interface IRules {
  edgeTypes?: string[];
  edgeDirection?: string;
  vertexColor?: string;
  quantityLimit?: number;
  stepsType?: string;
  step?: number;
  minStep?: number;
  maxStep?: number;
  customColor?: string;
  filters?: any[];
}

interface IState {
  vertexes: INode[];
  edges: IPath[];
  selectVertexes: INode[];
  selectEdges: IPath[];
  actionHistory: any[];
  step: number;
  exploreRules: IRules;
  preloadData: IExportData;
  showTagFields: string[];
  showEdgeFields: string[];
}

const whichColor = (() => {
  const colorsTotal = DEFAULT_COLOR_PICK_LIST.length;
  let colorIndex = 0;
  const colorsRecord = {};
  return key => {
    if (!colorsRecord[key]) {
      colorsRecord[key] = DEFAULT_COLOR_PICK_LIST[colorIndex];
      colorIndex = (colorIndex + 1) % colorsTotal;
    }
    return colorsRecord[key];
  };
})();

function getGroup(tags) {
  return 't-' + tags.sort().join('-');
}

function getTagData(nodes, expand) {
  const data = nodes.map(node => {
    const { vid, tags, properties } = node;
    const group = getGroup(tags);
    const color =
      expand && expand.customColor && expand.vertexColor === 'custom'
        ? expand.customColor
        : whichColor(group);
    const nodeProp = {
      tags,
      properties,
    };
    const uuid = uuidv4();
    return {
      name: convertBigNumberToString(vid),
      nodeProp,
      group,
      uuid,
      color,
    };
  });
  return data;
}

export const explore = createModel({
  state: {
    vertexes: [],
    edges: [],
    selectVertexes: [],
    selectEdges: [],
    actionHistory: [],
    step: 0,
    exploreRules: DEFAULT_EXPLORE_RULES as IRules,
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
        actionHistory,
      } = state;
      const { vertexes: addVertexes, edges: addEdges } = payload;

      const svg: any = d3.select('#output-graph');
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
      const vertexes = _.uniqBy([...originVertexes, ...addVertexes], v =>
        convertBigNumberToString(v.name),
      );
      actionHistory.push({
        type: 'ADD',
        vertexes: _.differenceBy(addVertexes, originVertexes, v =>
          convertBigNumberToString(v.name),
        ),
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
        actionHistory,
      };
    },

    clear: () => {
      return {
        vertexes: [],
        edges: [],
        selectVertexes: [],
        selectEdges: [],
        actionHistory: [],
        step: 0,
        exploreRules: DEFAULT_EXPLORE_RULES,
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
    async asyncGetVertexes(
      payload: {
        ids: string[];
        expand?: {
          vertexColor: string;
          customColor;
        };
      },
      rootState,
    ) {
      const { ids, expand } = payload;
      const {
        nebula: { spaceVidType },
      } = rootState;
      const res = await fetchVertexProps({ ids, spaceVidType });
      let newVertexes = res.code === 0 ? getTagData(res.data, expand) : [];
      newVertexes = await this.asyncCheckVertexesExist({
        preAddVertexes: newVertexes,
        inputIds: ids.map(id => String(id)),
        expand,
      });
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

    async deleteNodesAndEdges(_payload, rootState) {
      const {
        vertexes: originVertexes,
        edges,
        selectVertexes,
        selectEdges,
        actionHistory,
      } = rootState.explore;
      const originEdges = [...edges];
      selectVertexes.forEach(item => {
        _.remove(
          originEdges,
          v => v.source.uuid === item.uuid || v.target.uuid === item.uuid,
        );
      });
      selectEdges.forEach(item => {
        _.remove(originEdges, v => v.uuid === item.uuid);
      });
      const vertexes = _.differenceBy(
        originVertexes,
        selectVertexes,
        (v: INode) => v.uuid,
      );
      actionHistory.push({
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
        actionHistory,
        selectVertexes: [],
        selectEdges: [],
      });
    },

    async asyncGetExpand(payload: {
      selectVertexes: any[];
      edgeTypes: string[];
      edgesFields: any[];
      edgeDirection: string;
      filters: any[];
      vertexColor: string;
      quantityLimit: number | null;
      stepsType: string;
      step?: string;
      minStep?: string;
      maxStep?: string;
      customColor?: string;
    }) {
      const data = (await this.asyncGetExpandData(payload)) as any;
      const { vertexColor, customColor } = payload;
      await this.asyncGetExploreInfo({
        data,
        expand: {
          vertexColor,
          customColor,
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

    async asyncGetExploreVertex(payload: {
      ids: string[];
      expand?: {
        vertexColor: string;
        customColor;
      };
    }) {
      const { ids, expand } = payload;
      const _ids = _.uniqBy(ids, i => convertBigNumberToString(i));
      const vertexes: any =
        _ids.length > 0
          ? await this.asyncGetVertexes({
              ids: _ids,
              expand,
            })
          : [];
      return _.uniqBy(vertexes, (i: any) =>
        convertBigNumberToString(i.name),
      ).filter(i => i !== undefined);
    },

    // check if vertex exist
    async asyncCheckVertexesExist(
      payload: {
        preAddVertexes;
        inputIds: string[];
        expand;
      },
      rootState,
    ) {
      const { preAddVertexes, inputIds, expand } = payload;
      const preAddIds = preAddVertexes.map(i => String(i.name));
      if (preAddIds.length !== inputIds.length) {
        // Get the missing id in the returned result
        const notIncludedIds = _.xor(preAddIds, inputIds);
        // judge whether it is a vertex on the hanging edge
        const existedIds = (await this.asyncGetVertexesOnHangingEdge({
          ids: notIncludedIds,
        })) as any;
        // If the id in notIncludedIds exists in the existedIds, means that its a vertex on the hanging edge
        // otherwise it really does not exist in nebula
        const notExistIds = notIncludedIds.filter(
          id => !existedIds.includes(id),
        );
        const addIds = notIncludedIds.filter(id => existedIds.includes(id));
        if (notExistIds.length > 0) {
          message.warning(
            `${notExistIds.join(', ')}${intl.get('import.notExist')}`,
          );
        }
        const {
          nebula: { spaceVidType },
        } = rootState;
        addIds.forEach(id => {
          const vertex: any = {
            name: spaceVidType === 'INT64' ? Number(id) : String(id),
            nodeProp: {
              tags: [],
              properties: {},
            },
            uuid: uuidv4(),
          };
          if (expand && expand.vertexColor === 'groupByTag') {
            vertex.group = 't';
          }
          preAddVertexes.push(vertex);
        });
      }
      return preAddVertexes;
    },

    async asyncGetVertexesOnHangingEdge(payload: { ids: string[] }, rootState) {
      const { ids } = payload;
      const {
        nebula: { spaceVidType },
      } = rootState;
      // If these ids have hanging edges, get the src/dst id of these input ids on the hanging edges
      let bidirectRes = await fetchBidirectVertexes({ ids, spaceVidType });
      let _ids =
        bidirectRes.code === 0 ? getBidrectVertexIds(bidirectRes.data) : [];
      if (_ids.length > 0) {
        // Batch query cannot accurately know which input ids have hanging edges
        // So use the result ids to query the corresponding ids on all edges
        // these ids must include vertex id of the haning edge
        bidirectRes = await fetchBidirectVertexes({ ids: _ids, spaceVidType });
        _ids =
          bidirectRes.code === 0 ? getBidrectVertexIds(bidirectRes.data) : [];
      }
      return _ids;
    },

    async asyncGetExploreEdge(edgeList: IExportEdge[], rootState) {
      let _edges = [];
      if (edgeList.length > 0) {
        const type = edgeList[0].edgeType;
        const {
          nebula: { spaceVidType },
        } = rootState;
        const res = await fetchEdgeProps({
          idRoutes: edgeList.map(
            i =>
              `${handleVidStringName(
                i.srcId,
                spaceVidType,
              )}->${handleVidStringName(i.dstId, spaceVidType)}@${i.rank}`,
          ),
          type,
        });
        _edges = res.tables
          .map(item => item._edgesParsedList)
          .flat()
          .map(item => {
            const edgeProp = {
              properties: item.properties,
            };
            return {
              source: convertBigNumberToString(item.srcID),
              target: convertBigNumberToString(item.dstID),
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

    async asyncGetExploreInfo(payload: {
      data: IExportData;
      expand?: {
        vertexColor: string;
        customColor;
      };
    }) {
      const { data, expand } = payload;
      const { vertexes, edges } = data;
      const _vertexes = await this.asyncGetExploreVertex({
        ids: vertexes,
        expand,
      });
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

    async asyncAutoExpand(_payload, rootState) {
      const {
        nebula: { edgeTypes },
        explore: { selectVertexes, exploreRules },
      } = rootState;
      const rules = { selectVertexes, ...exploreRules };
      if (!rules.edgeTypes || rules.edgeTypes.length === 0) {
        rules.edgeTypes = edgeTypes;
      }
      if (rules.stepsType === 'range' && (!rules.minStep || !rules.maxStep)) {
        return message.warning(intl.get('explore.missingParams'));
      }
      const data = (await this.asyncGetExpandData(rules)) as any;
      const { vertexColor, customColor } = rules;
      await this.asyncGetExploreInfo({
        data,
        expand: {
          vertexColor,
          customColor,
        },
      });
    },

    async asyncGetExpandData(
      payload: {
        selectVertexes: any[];
        edgeTypes: string[];
        edgesFields?: any[];
        edgeDirection: string;
        filters?: any[];
        vertexColor?: string;
        quantityLimit?: number | null;
        stepsType?: string;
        step?: string;
        minStep?: string;
        maxStep?: string;
      },
      rootState,
    ) {
      const {
        selectVertexes,
        edgeTypes,
        edgeDirection,
        filters,
        quantityLimit,
        stepsType,
        step,
        minStep,
        maxStep,
      } = payload;
      const {
        nebula: { spaceVidType },
      } = rootState;
      const gql = getExploreMatchGQL({
        selectVertexes,
        edgeTypes,
        edgeDirection,
        filters,
        quantityLimit,
        spaceVidType,
        stepsType,
        step,
        minStep,
        maxStep,
      });
      const { code, data, message: errMsg } = (await service.execNGQL({
        gql,
      })) as any;
      if (code === 0) {
        const { vertexes, edges } = parsePathToGraph(data.tables, spaceVidType);
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

    async asyncGetPathResult(payload: {
      type: string;
      srcId: string[];
      dstId: string[];
      relation?: string[];
      direction?: string;
      stepLimit?: number | null;
      quantityLimit?: number | null;
      spaceVidType: string;
    }) {
      const { spaceVidType } = payload;
      const gql = getPathGQL(payload);
      const { code, data, message: errMsg } = (await service.execNGQL({
        gql,
      })) as any;
      if (code === 0) {
        if (data.tables.length === 0) {
          message.warning(intl.get('common.noData'));
        } else {
          const _data = parsePathToGraph(data.tables, spaceVidType);
          this.asyncGetExploreInfo({ data: _data });
        }
      } else {
        message.warning(errMsg);
      }
    },
  }),
});
