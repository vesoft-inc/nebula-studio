import { LinkObject, NodeObject } from '@vesoft-inc/force-graph';
import { action, isObservableSet, makeAutoObservable, observable } from 'mobx';
import { message } from 'antd';
import { getI18n } from '@vesoft-inc/i18n';
import { groupBy, uniqBy, xor } from 'lodash';
import { getBidrectVertexIds, getTagData, whichColor } from '@app/utils/parseData';
import { convertBigNumberToString, handleVidStringName } from '@app/utils/function';
import { fetchBidirectVertexes, fetchEdgeProps, fetchVertexProps } from '@app/utils/fetch';
import { IDataMap, Pointer } from '@app/interfaces/graph';
import { makeRoundPosition, updateEdgeMap, updateTagMap } from '@app/config/explore';
import TwoGraph from './twoGraph';

const excludesProperty = ['twoGraph', 'graph', 'canvas', 'width', 'height', 'loading'];
const { intl } = getI18n();

export class GraphStore {
  nowDataMap: IDataMap = {};
  nodes = observable.set([] as NodeObject[], { deep: false });
  links = observable.set([] as LinkObject[], { deep: false });
  nodesSelected = observable.set([] as NodeObject[], { deep: false });
  linksSelected = observable.set([] as LinkObject[], { deep: false });
  nodeHovering: NodeObject | null = null;
  nodeDragging: NodeObject | null = null;
  linkHovering: LinkObject | null = null;
  tagsFields: any[] = [];
  id: string;
  tags: string[] = [];
  edgeTypes: string[] = [];
  vertexFilters: any[] = [];
  edgesFields: any[] = [];
  showTagFields: string[] = [];
  showEdgeFields: string[] = [];
  loading = false;
  filterExclusionIds: { [key: string]: boolean } = {};
  pointer: Pointer = {
    top: 0,
    left: 0,
    event: undefined,
    showContextMenu: false,
  };
  layout = 'force';
  /** not observe */
  twoGraph?: TwoGraph = undefined;
  canvas: HTMLCanvasElement | undefined;
  width = 0;
  height = 0;
  currentSpace: string | undefined;
  spaceVidType: string | undefined;
  get selectedNodeIds() {
    return [...this.nodesSelected].map(({ id }) => id);
  }

  get tagColorMap() {
    const tagColorMap = {};
    if (this.tags) {
      this.tags.forEach((item) => {
        tagColorMap[item] = [
          {
            color: whichColor(item),
            countIds: [],
          },
        ];
      });
    }
    updateTagMap(tagColorMap, this.nodes);
    return tagColorMap;
  }

  get edgeMap() {
    const edgeMap = {};
    if (this.edgeTypes) {
      this.edgeTypes.forEach((edge) => {
        edgeMap[edge] = {
          countIds: [],
        };
      });
    }
    updateEdgeMap(edgeMap, this.links);
    return edgeMap;
  }

  constructor(props?: { space: string; spaceVidType?: string }) {
    makeAutoObservable(this, {
      nodeHovering: observable.ref,
      nodeDragging: observable.ref,
      linkHovering: observable.ref,
      pointer: observable.ref,
      nowDataMap: false,
      twoGraph: false,
      canvas: false,
      update: action,
    });
    this.currentSpace = props?.space;
    this.spaceVidType = props?.spaceVidType;
  }

  update = (payload: Record<string, any>) =>
    Object.keys(payload).forEach(
      (key) => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key]),
    );

  // init data & rerender
  initData = ({ nodes, links }: { nodes?: NodeObject[]; links?: LinkObject[] }) => {
    if (nodes) this.nodes.replace(nodes);
    if (links) this.links.replace(links);
  };
  setData(tab) {
    const shadowStore = new GraphStore();
    Object.keys(tab).forEach((key) => {
      if (shadowStore.hasOwnProperty(key)) {
        if (isObservableSet(this[key])) {
          this[key].replace(Array.from(tab[key]));
        } else {
          this[key] = tab[key];
        }
      }
    });
    this.twoGraph?.setData(tab);
  }

  getData = (excludes: string[] = []) => {
    const data = {} as Record<string, any>;
    for (const key in this) {
      if (typeof this[key] !== 'function' && ![...excludes, ...excludesProperty].includes(key)) {
        data[key] = this[key];
      }
    }
    Object.assign(data, this.twoGraph?.getData());
    return data;
  };

  setSelectedNodeIds = (ids: string[]) => {
    const idsSet = new Set(ids);
    this.nodesSelected.clear();
    this.nodes.forEach((node) => idsSet.has(<string>node.id) && this.nodesSelected.add(node));
  };
  setSelectedLinkIds = (ids: string[]) => {
    const idsSet = new Set(ids);
    this.linksSelected.clear();
    this.links.forEach((link) => idsSet.has(<string>link.id) && this.linksSelected.add(link));
  };

  selectNodes = (nodes: NodeObject[]) => {
    nodes.forEach((node) => {
      !this.filterExclusionIds[node.id] && this.nodesSelected.add(node);
    });
  };
  unselectNodes = (nodes?: NodeObject[]) => {
    nodes ? nodes.forEach((node) => this.nodesSelected.delete(node)) : this.nodesSelected.clear();
  };
  replaceNodeSelected = (nodes: NodeObject[]) => {
    this.nodesSelected.replace(nodes.filter((node) => !this.filterExclusionIds[node.id]));
  };
  setHoveringNode = (node: NodeObject | null) => {
    if (node === this.nodeHovering) return;

    this.nodeHovering = node || null;
  };
  setDraggingNode = (node: NodeObject | null) => {
    this.nodeDragging = node || null;
  };
  selectLinks = (links: LinkObject[]) => {
    links.forEach((link) => this.linksSelected.add(link));
  };
  setHoveingdLink = (link: LinkObject | null) => {
    if (this.linkHovering === link) return;
    this.linkHovering = link || null;
  };
  unselectLinks = (links?: LinkObject[]) => {
    links ? links.forEach((link) => this.linksSelected.delete(link)) : this.linksSelected.clear();
  };
  setPointer = (pointer: any) => {
    if (this.pointer.showContextMenu && pointer.showContextMenu === undefined) {
      return;
    }
    this.pointer = { ...this.pointer, ...pointer };
  };

  /**
   * add nodes & format & init node pre position
   *
   * @param payload vertexes,edges
   * @returns
   */
  addNodesAndEdges = (payload: { vertexes: NodeObject[]; edges: LinkObject[] }) => {
    const { vertexes = [], edges = [] } = payload;
    // filter exsit data and update it
    const nowDataMap = {};
    this.links.forEach((item) => {
      const link = item as any;
      nowDataMap[link.id] = item;
    });
    this.nodes.forEach((item) => {
      const node = item as any;
      nowDataMap[node.id] = item;
    });
    // search exsit nodes & update it
    vertexes.forEach((node) => {
      node.id = convertBigNumberToString(node.id);
      if (!nowDataMap[node.id]) {
        nowDataMap[node.id] = node;
        this.nodes.add(node);
      } else {
        Object.assign(nowDataMap[node.id].properties, node.properties);
      }
    });
    (edges as any[]).forEach((link) => {
      if (!nowDataMap[link.id]) {
        this.links.add(link);
        nowDataMap[link.id] = link;
        link.source = nowDataMap[link.source];
        link.target = nowDataMap[link.target];
      } else {
        const { source, target, ...others } = link;
        delete link.color;
        Object.assign(nowDataMap[link.id], others);
      }
    });

    // makesure there are new nodes
    if (Object.keys(nowDataMap).length === Object.keys(this.nowDataMap).length) {
      return;
    }
    // make newest data map
    this.nowDataMap = nowDataMap;
  };

  // makeLineSort by line's direction & rank to make the same direction be close
  makeLineSort() {
    // update link sort
    const sourceMap = {};
    this.links.forEach((link) => {
      const sourceId = typeof link.source !== 'object' ? link.source : link.source.id;
      const targetId = typeof link.target !== 'object' ? link.target : link.target.id;
      const sourceCommonId = `${sourceId}=>${targetId}`;
      const targetCommonId = `${targetId}=>${sourceId}`;
      const linkArr = sourceMap[sourceCommonId] || sourceMap[targetCommonId];
      if (!linkArr) {
        sourceMap[sourceCommonId] = [link];
      } else if (sourceMap[sourceCommonId]) {
        linkArr.unshift(link);
      } else if (sourceMap[targetCommonId]) {
        linkArr.push(link);
      }
    });
    // update link's graphIndex
    Object.keys(sourceMap).forEach((key) => {
      if (sourceMap[key].length > 1) {
        const source = sourceMap[key][0].source;
        let status = true;
        let number = 1;
        while (sourceMap[key].length) {
          const link = status ? sourceMap[key].pop() : sourceMap[key].shift();
          link.graphIndex = number;
          // check direction
          if (link.source !== source) {
            link.graphIndex *= -1;
          }
          number++;
          status = !status;
        }
      } else {
        const link = sourceMap[key][0];
        if (link.source === link.target) {
          link.graphIndex = 1;
        } else {
          link.graphIndex = 0;
        }
      }
    });
  }

  getExploreInfo = async (payload) => {
    const { data, expand } = payload;
    const { vertexes, edges } = data;
    const _vertexes = await this.getExploreVertex({
      ids: vertexes,
      expand,
    });
    let _edges: any = groupBy(edges, (e) => e.edgeType);
    _edges = await Promise.all(
      Object.values(_edges).map(async (item) => {
        return this.getExploreEdge(item);
      }),
    );
    if (this.nodes.size === 0 && _vertexes.length !== 1) {
      // make round position width init data
      makeRoundPosition(_vertexes, { x: 0, y: 0 });
    }
    this.addNodesAndEdges({
      vertexes: _vertexes,
      edges: _edges.flat(),
    });
  };

  getExploreEdge = async (edgeList) => {
    let _edges = [];
    if (edgeList.length > 0) {
      const edgeType = edgeList[0].edgeType;
      const res = await fetchEdgeProps({
        idRoutes: edgeList.map(
          (i) =>
            `${handleVidStringName(i.srcId, this.spaceVidType)}->${handleVidStringName(i.dstId, this.spaceVidType)}@${
              i.rank
            }`,
        ),
        type: edgeType,
        space: this.currentSpace,
      });
      _edges = res.tables
        .map((item) => item._edgesParsedList)
        .flat()
        .map((item) => {
          return {
            source: convertBigNumberToString(item.srcID),
            target: convertBigNumberToString(item.dstID),
            id: `${edgeType} ${item.srcID}->${item.dstID} @${item.rank}`,
            rank: item.rank,
            edgeType,
            properties: item.properties,
            label: edgeType,
          };
        });
    }
    return _edges;
  };

  getExploreVertex = async (payload: {
    ids: string[];
    expand?: {
      vertexStyle: string;
      customColor: string;
      customIcon: string;
    };
  }) => {
    const { ids, expand } = payload;
    const _ids = uniqBy(ids, (i) => convertBigNumberToString(i));
    const vertexes: any =
      _ids.length > 0
        ? await this.getVertexes({
            ids: _ids,
            expand,
          })
        : [];
    return uniqBy(vertexes, (i: NodeObject) => convertBigNumberToString(i.id)).filter((i) => i !== undefined);
  };

  getVertexes = async (payload) => {
    const { ids, expand } = payload;
    const res = await fetchVertexProps({ ids, spaceVidType: this.spaceVidType, space: this.currentSpace });
    let newVertexes = res.code === 0 ? getTagData(res.data, expand, this.tagColorMap) : [];
    if (newVertexes.length > 0) {
      newVertexes = await this.checkVertexesExist({
        preAddVertexes: newVertexes,
        inputIds: ids.map((id) => String(id)),
        expand,
      });
    }
    return newVertexes;
  };

  checkVertexesExist = async (payload) => {
    const { preAddVertexes, inputIds, expand } = payload;
    const preAddIds = preAddVertexes.map((i) => String(i.id));
    if (preAddIds.length !== inputIds.length) {
      // Get the missing id in the returned result
      const notIncludedIds = xor(preAddIds, inputIds);
      // judge whether it is a vertex on the hanging edge
      const existedIds = (await this.getVertexesOnHangingEdge({
        ids: notIncludedIds as string[],
      })) as any;
      // If the id in notIncludedIds exists in the existedIds, means that its a vertex on the hanging edge
      // otherwise it really does not exist in nebula
      const notExistIds = notIncludedIds.filter((id) => !existedIds.includes(id));
      const addIds = notIncludedIds.filter((id) => existedIds.includes(id));
      if (notExistIds.length > 0) {
        message.warning(`${notExistIds.join(', ')}${intl.get('explore.notExist')}`);
      }
      addIds.forEach((id) => {
        const vertex: any = {
          id: this.spaceVidType === 'INT64' ? Number(id) : String(id),
          tags: [],
          properties: {},
        };
        if (expand?.vertexStyle === 'groupByTag') {
          vertex.group = 't';
        }
        preAddVertexes.push(vertex);
      });
    }
    return preAddVertexes;
  };

  async getVertexesOnHangingEdge(payload: { ids: string[] }) {
    const { ids } = payload;
    const res = await fetchBidirectVertexes({ ids, spaceVidType: this.spaceVidType, space: this.currentSpace });
    const vertexIds = res.code === 0 ? getBidrectVertexIds(res.data) : [];
    return vertexIds.filter((id) => ids.includes(id));
  }

  destroyGraph() {
    this.twoGraph?.destroy();
    window.removeEventListener('resize', this.resize);
  }

  resize = () => {
    if (!this.twoGraph) return;
    const rect = this.twoGraph.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.twoGraph.resize();
  };

  // init ForceGraph instance ,it will be called only once
  initGraph = ({ container }: { container: HTMLElement }) => {
    this.twoGraph = new TwoGraph(this, container);
    window.addEventListener('resize', this.resize);
  };
}

const graphStore = new GraphStore();
export default graphStore;
