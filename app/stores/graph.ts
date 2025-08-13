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

  // 扩展选中节点的邻居节点
  expandSelectedNodes = async () => {
    if (this.nodesSelected.size === 0) {
      console.warn('没有选中节点');
      message.warning(intl.get('explore.selectNodeFirst'));
      return;
    }

    const selectedNodes = [...this.nodesSelected];
    const nodeIds = selectedNodes.map((node: NodeObject) => String(node.id));

    try {
      // 获取选中节点的邻居
      const res = await fetchBidirectVertexes({
        ids: nodeIds,
        spaceVidType: this.spaceVidType,
        space: this.currentSpace,
      });

      if (res.code === 0) {
        // 解析结果获取新的节点和边
        const { vertexes, edges } = this.parseExpandResult(res.data.tables, nodeIds);

        if (vertexes.length > 0 || edges.length > 0) {
          await this.getExploreInfo({
            data: { vertexes, edges },
            expand: { vertexStyle: 'default' },
          });

          // 优化新节点的布局
          this.optimizeExpandedNodesLayout(selectedNodes, vertexes);

          // 应用磁力效应
          setTimeout(() => {
            this.applyMagneticForces();
          }, 100);

          message.success(intl.get('explore.expandSuccess', { vertexCount: vertexes.length, edgeCount: edges.length }));
        } else {
          message.info(intl.get('explore.noNewNeighbors'));
        }
      } else {
        console.error('查询失败:', res);
        message.error(`${intl.get('explore.queryFailed')}: ${res.message}`);
      }
    } catch (error) {
      console.error('扩展节点失败:', error);
      message.error(`${intl.get('explore.expandFailed')}: ${error.message || intl.get('common.fail')}`);
    }
  };

  // 解析扩展查询结果
  parseExpandResult = (tables: any[], selectedNodeIds: string[]) => {
    const newVertexes = new Set<string>();
    const newEdges: any[] = [];
    const existingNodeIds = new Set([...this.nodes].map((node) => String(node.id)));

    // 处理返回的tables数组，每个table是一个对象，包含_edgesParsedList
    tables.forEach((table) => {
      if (table._edgesParsedList && Array.isArray(table._edgesParsedList)) {
        table._edgesParsedList.forEach((edge: any) => {
          const src = String(edge.srcID);
          const dst = String(edge.dstID);

          // 添加新的顶点ID (排除已存在的节点)
          if (!existingNodeIds.has(src) && !selectedNodeIds.includes(src)) {
            newVertexes.add(src);
          }
          if (!existingNodeIds.has(dst) && !selectedNodeIds.includes(dst)) {
            newVertexes.add(dst);
          }

          // 添加边信息
          const edgeId = `${edge.edgeName} ${src}->${dst} @${edge.rank || 0}`;
          const existingEdge = [...this.links].find((link) => link.id === edgeId);

          if (!existingEdge) {
            newEdges.push({
              srcId: src,
              dstId: dst,
              edgeType: edge.edgeName,
              rank: edge.rank || 0,
            });
          }
        });
      }
    });

    const result = {
      vertexes: Array.from(newVertexes),
      edges: newEdges,
    };

    return result;
  };

  // 优化扩展节点的布局
  optimizeExpandedNodesLayout = (selectedNodes: NodeObject[], newVertexIds: string[]) => {
    // 找到新添加的节点
    const newNodes = [...this.nodes].filter((node) => newVertexIds.includes(String(node.id)));

    if (newNodes.length === 0) return;

    // 计算已使用的位置，避免重叠
    const usedPositions: Array<{ x: number; y: number }> = [];

    // 为每个选中节点分配其邻居节点
    selectedNodes.forEach((selectedNode, selectedIndex) => {
      // 找到连接到此选中节点的新节点
      const connectedNewNodes = newNodes.filter((newNode) => {
        return [...this.links].some(
          (link) =>
            (String(link.source) === String(selectedNode.id) && String(link.target) === String(newNode.id)) ||
            (String(link.target) === String(selectedNode.id) && String(link.source) === String(newNode.id)),
        );
      });

      if (connectedNewNodes.length > 0) {
        // 为多选节点计算不同的起始角度，避免重叠
        const angleOffset = (selectedIndex / selectedNodes.length) * Math.PI * 2;
        this.arrangeNodesAroundCenter(selectedNode, connectedNewNodes, usedPositions, angleOffset);
      }
    });

    // 延迟更新图形布局，让位置设置生效
    setTimeout(() => {
      this.initData({ nodes: [...this.nodes], links: [...this.links] });
    }, 50);
  };

  // 在中心节点周围圆形排列新节点
  arrangeNodesAroundCenter = (
    centerNode: NodeObject,
    newNodes: NodeObject[],
    usedPositions: Array<{ x: number; y: number }> = [],
    angleOffset = 0,
  ) => {
    const centerX = centerNode.x || 0;
    const centerY = centerNode.y || 0;
    const nodeCount = newNodes.length;
    const minDistance = 60; // 节点间最小距离

    // 根据节点数量智能计算半径
    const circumference = nodeCount * minDistance * 1.2; // 圆周长度，预留空间
    const optimalRadius = Math.max(80, circumference / (2 * Math.PI)); // 最优半径

    // 分层排列：如果节点太多，使用多层圆形
    const maxNodesPerLayer = Math.floor((2 * Math.PI * optimalRadius) / minDistance);
    const layerCount = Math.ceil(nodeCount / maxNodesPerLayer);

    newNodes.forEach((node, index) => {
      let position: { x: number; y: number } | null = null;
      let attempts = 0;
      const maxAttempts = 15;

      // 确定节点所在的层
      const layer = Math.floor(index / maxNodesPerLayer);
      const indexInLayer = index % maxNodesPerLayer;
      const nodesInThisLayer = Math.min(maxNodesPerLayer, nodeCount - layer * maxNodesPerLayer);

      // 当前层的半径
      const layerRadius = optimalRadius + layer * 80;

      // 尝试找到一个不重叠的位置
      while (!position && attempts < maxAttempts) {
        // 计算在当前层中的角度位置
        const angleStep = (2 * Math.PI) / nodesInThisLayer;
        const baseAngle = indexInLayer * angleStep + angleOffset;

        // 添加少量随机偏移，让排列更自然
        const angleJitter = attempts === 0 ? 0 : (Math.random() - 0.5) * 0.2;
        const radius = layerRadius + attempts * 15; // 尝试次数增加时略微增加半径
        const finalAngle = baseAngle + angleJitter;

        const x = centerX + radius * Math.cos(finalAngle);
        const y = centerY + radius * Math.sin(finalAngle);

        // 检查是否与已有位置重叠
        const hasOverlap = usedPositions.some((pos) => {
          const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
          return distance < minDistance;
        });

        // 检查是否与现有节点重叠
        const hasNodeOverlap = [...this.nodes].some((existingNode) => {
          if (existingNode.id === node.id) return false;
          const distance = Math.sqrt(((existingNode.x || 0) - x) ** 2 + ((existingNode.y || 0) - y) ** 2);
          return distance < minDistance;
        });

        if (!hasOverlap && !hasNodeOverlap) {
          position = { x, y };
          usedPositions.push(position);
        }

        attempts++;
      }

      // 如果找不到合适位置，使用外圆随机位置
      if (!position) {
        const angle = Math.random() * Math.PI * 2;
        const radius = optimalRadius + layerCount * 80 + Math.random() * 50;
        position = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
        usedPositions.push(position);
        console.warn(`节点 ${node.id} 使用随机位置:`, position);
      }

      // 设置新节点的位置
      node.x = position.x;
      node.y = position.y;

      // 不设置初始速度，让节点保持在设定位置
      node.vx = 0;
      node.vy = 0;
    });
  };

  // 应用磁力效应
  applyMagneticForces = () => {
    const nodes = [...this.nodes];
    const links = [...this.links];

    // 计算节点关联度（连接数量）
    const nodeConnections = this.calculateNodeConnections(nodes, links);

    // 计算节点相似度
    const nodeSimilarities = this.calculateNodeSimilarities(nodes);

    // 应用多种磁力效应
    const forces = {
      // 连接力：直接连接的节点相互吸引
      connection: this.calculateConnectionForces(nodes, links),
      // 相似力：相似属性的节点相互吸引
      similarity: this.calculateSimilarityForces(nodes, nodeSimilarities),
      // 度数力：高度数节点居中，低度数节点外围
      degree: this.calculateDegreeForces(nodes, nodeConnections),
      // 排斥力：避免节点过度聚集
      repulsion: this.calculateRepulsionForces(nodes),
    };

    // 合成并应用力效应
    this.applyForces(nodes, forces);

    // 平滑动画更新位置
    this.animateToNewPositions(nodes);
  };

  // 计算节点连接数
  calculateNodeConnections = (nodes: NodeObject[], links: LinkObject[]): Map<string, number> => {
    const connections = new Map<string, number>();

    nodes.forEach((node) => {
      const nodeId = String(node.id);
      const connectionCount = links.filter(
        (link) => String(link.source) === nodeId || String(link.target) === nodeId,
      ).length;
      connections.set(nodeId, connectionCount);
    });

    return connections;
  };

  // 计算节点相似度
  calculateNodeSimilarities = (nodes: NodeObject[]): Map<string, Map<string, number>> => {
    const similarities = new Map<string, Map<string, number>>();

    nodes.forEach((nodeA) => {
      const similarityMap = new Map<string, number>();
      nodes.forEach((nodeB) => {
        if (nodeA.id !== nodeB.id) {
          const similarity = this.calculatePairwiseSimilarity(nodeA, nodeB);
          similarityMap.set(String(nodeB.id), similarity);
        }
      });
      similarities.set(String(nodeA.id), similarityMap);
    });

    return similarities;
  };

  // 计算两个节点的相似度
  calculatePairwiseSimilarity = (nodeA: NodeObject, nodeB: NodeObject): number => {
    let similarity = 0;

    // 基于标签相似度
    if (nodeA.tags && nodeB.tags && Array.isArray(nodeA.tags) && Array.isArray(nodeB.tags)) {
      const tagsA = new Set(nodeA.tags);
      const tagsB = new Set(nodeB.tags);
      const intersection = new Set([...tagsA].filter((tag) => tagsB.has(tag)));
      const union = new Set([...tagsA, ...tagsB]);
      similarity += (intersection.size / union.size) * 0.6; // 标签权重60%
    }

    // 基于颜色相似度
    if (nodeA.color && nodeB.color && nodeA.color === nodeB.color) {
      similarity += 0.2; // 颜色权重20%
    }

    // 基于大小相似度
    if (typeof nodeA.size === 'number' && typeof nodeB.size === 'number') {
      const sizeDiff = Math.abs(nodeA.size - nodeB.size);
      const maxSize = Math.max(nodeA.size, nodeB.size);
      similarity += (1 - sizeDiff / maxSize) * 0.2; // 大小权重20%
    }

    return Math.min(similarity, 1);
  };

  // 计算连接力
  calculateConnectionForces = (nodes: NodeObject[], links: LinkObject[]): Map<string, { fx: number; fy: number }> => {
    const forces = new Map<string, { fx: number; fy: number }>();

    // 初始化力向量
    nodes.forEach((node) => {
      forces.set(String(node.id), { fx: 0, fy: 0 });
    });

    // 计算连接节点间的吸引力
    links.forEach((link) => {
      const sourceId = String(link.source);
      const targetId = String(link.target);
      const sourceNode = nodes.find((n) => String(n.id) === sourceId);
      const targetNode = nodes.find((n) => String(n.id) === targetId);

      if (sourceNode && targetNode) {
        const dx = (targetNode.x || 0) - (sourceNode.x || 0);
        const dy = (targetNode.y || 0) - (sourceNode.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const idealDistance = 80; // 理想连接距离

        if (distance > idealDistance) {
          const forceStrength = Math.min((distance - idealDistance) * 0.1, 5);
          const fx = (dx / distance) * forceStrength;
          const fy = (dy / distance) * forceStrength;

          // 对源节点施加向目标的力
          const sourceForce = forces.get(sourceId)!;
          sourceForce.fx += fx;
          sourceForce.fy += fy;

          // 对目标节点施加向源的力
          const targetForce = forces.get(targetId)!;
          targetForce.fx -= fx;
          targetForce.fy -= fy;
        }
      }
    });

    return forces;
  };

  // 计算相似力
  calculateSimilarityForces = (
    nodes: NodeObject[],
    similarities: Map<string, Map<string, number>>,
  ): Map<string, { fx: number; fy: number }> => {
    const forces = new Map<string, { fx: number; fy: number }>();

    // 初始化力向量
    nodes.forEach((node) => {
      forces.set(String(node.id), { fx: 0, fy: 0 });
    });

    // 计算相似节点间的吸引力
    nodes.forEach((nodeA) => {
      const nodeAId = String(nodeA.id);
      const similarityMap = similarities.get(nodeAId);

      if (similarityMap) {
        nodes.forEach((nodeB) => {
          const nodeBId = String(nodeB.id);
          const similarity = similarityMap.get(nodeBId);

          if (similarity && similarity > 0.3) {
            // 相似度阈值
            const dx = (nodeB.x || 0) - (nodeA.x || 0);
            const dy = (nodeB.y || 0) - (nodeA.y || 0);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 60) {
              // 避免过度聚集
              const forceStrength = similarity * 2;
              const fx = (dx / distance) * forceStrength;
              const fy = (dy / distance) * forceStrength;

              const nodeAForce = forces.get(nodeAId)!;
              nodeAForce.fx += fx;
              nodeAForce.fy += fy;
            }
          }
        });
      }
    });

    return forces;
  };

  // 计算度数力（高度数节点趋向中心）
  calculateDegreeForces = (
    nodes: NodeObject[],
    connections: Map<string, number>,
  ): Map<string, { fx: number; fy: number }> => {
    const forces = new Map<string, { fx: number; fy: number }>();

    // 计算图的中心点
    const centerX = nodes.reduce((sum, node) => sum + (node.x || 0), 0) / nodes.length;
    const centerY = nodes.reduce((sum, node) => sum + (node.y || 0), 0) / nodes.length;

    // 计算平均连接数
    const avgConnections = Array.from(connections.values()).reduce((sum, count) => sum + count, 0) / connections.size;

    nodes.forEach((node) => {
      const nodeId = String(node.id);
      const connectionCount = connections.get(nodeId) || 0;
      const connectionRatio = connectionCount / avgConnections;

      // 高度数节点向中心聚集，低度数节点向外扩散
      const dx = centerX - (node.x || 0);
      const dy = centerY - (node.y || 0);
      const distance = Math.sqrt(dx * dx + dy * dy);

      let forceStrength = 0;
      if (connectionRatio > 1.5) {
        // 高度数节点向中心
        forceStrength = (connectionRatio - 1) * 0.5;
      } else if (connectionRatio < 0.5) {
        // 低度数节点向外
        forceStrength = (0.5 - connectionRatio) * -0.3;
      }

      if (distance > 0 && forceStrength !== 0) {
        const fx = (dx / distance) * forceStrength;
        const fy = (dy / distance) * forceStrength;
        forces.set(nodeId, { fx, fy });
      } else {
        forces.set(nodeId, { fx: 0, fy: 0 });
      }
    });

    return forces;
  };

  // 计算排斥力
  calculateRepulsionForces = (nodes: NodeObject[]): Map<string, { fx: number; fy: number }> => {
    const forces = new Map<string, { fx: number; fy: number }>();
    const minDistance = 40; // 最小节点间距

    // 初始化力向量
    nodes.forEach((node) => {
      forces.set(String(node.id), { fx: 0, fy: 0 });
    });

    // 计算节点间的排斥力
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        const dx = (nodeB.x || 0) - (nodeA.x || 0);
        const dy = (nodeB.y || 0) - (nodeA.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance && distance > 0) {
          const repulsionStrength = (minDistance - distance) * 0.2;
          const fx = (dx / distance) * repulsionStrength;
          const fy = (dy / distance) * repulsionStrength;

          const forceA = forces.get(String(nodeA.id))!;
          const forceB = forces.get(String(nodeB.id))!;

          forceA.fx -= fx;
          forceA.fy -= fy;
          forceB.fx += fx;
          forceB.fy += fy;
        }
      }
    }

    return forces;
  };

  // 合成并应用所有力
  applyForces = (
    nodes: NodeObject[],
    forces: {
      connection: Map<string, { fx: number; fy: number }>;
      similarity: Map<string, { fx: number; fy: number }>;
      degree: Map<string, { fx: number; fy: number }>;
      repulsion: Map<string, { fx: number; fy: number }>;
    },
  ) => {
    const dampening = 0.8; // 阻尼系数

    nodes.forEach((node) => {
      const nodeId = String(node.id);

      // 合成所有力
      let totalFx = 0;
      let totalFy = 0;

      // 连接力权重最高
      const connectionForce = forces.connection.get(nodeId);
      if (connectionForce) {
        totalFx += connectionForce.fx * 0.4;
        totalFy += connectionForce.fy * 0.4;
      }

      // 相似力权重中等
      const similarityForce = forces.similarity.get(nodeId);
      if (similarityForce) {
        totalFx += similarityForce.fx * 0.2;
        totalFy += similarityForce.fy * 0.2;
      }

      // 度数力权重中等
      const degreeForce = forces.degree.get(nodeId);
      if (degreeForce) {
        totalFx += degreeForce.fx * 0.2;
        totalFy += degreeForce.fy * 0.2;
      }

      // 排斥力权重较高，防止重叠
      const repulsionForce = forces.repulsion.get(nodeId);
      if (repulsionForce) {
        totalFx += repulsionForce.fx * 0.3;
        totalFy += repulsionForce.fy * 0.3;
      }

      // 应用阻尼和速度限制
      const maxForce = 10;
      totalFx = Math.max(-maxForce, Math.min(maxForce, totalFx));
      totalFy = Math.max(-maxForce, Math.min(maxForce, totalFy));

      // 更新节点的速度（如果存在）
      if (node.vx !== undefined && node.vy !== undefined) {
        node.vx = (node.vx || 0) * dampening + totalFx;
        node.vy = (node.vy || 0) * dampening + totalFy;
      } else {
        node.vx = totalFx;
        node.vy = totalFy;
      }
    });
  };

  // 平滑动画到新位置
  animateToNewPositions = (nodes: NodeObject[]) => {
    const steps = 30; // 动画步数
    const duration = 1000; // 总时长1秒
    const stepDuration = duration / steps;

    let currentStep = 0;

    const animate = () => {
      if (currentStep >= steps) {
        return;
      }

      nodes.forEach((node) => {
        if (node.vx && node.vy) {
          // 每步移动速度的一小部分
          const stepFactor = 0.1;
          node.x = (node.x || 0) + node.vx * stepFactor;
          node.y = (node.y || 0) + node.vy * stepFactor;

          // 速度衰减
          node.vx *= 0.95;
          node.vy *= 0.95;
        }
      });

      // 更新图形
      this.initData({ nodes: [...this.nodes], links: [...this.links] });

      currentStep++;
      setTimeout(animate, stepDuration);
    };

    animate();
  };

  // 拖动磁力节流器
  private dragMagneticThrottle: number | null = null;

  // 拖动时应用磁力效应
  applyMagneticForcesDuringDrag = (draggedNode: NodeObject) => {
    // 使用节流避免过度计算
    if (this.dragMagneticThrottle) {
      clearTimeout(this.dragMagneticThrottle);
    }

    this.dragMagneticThrottle = setTimeout(() => {
      this.performMagneticAdjustment(draggedNode);
    }, 16); // 约60fps的更新频率
  };

  // 执行磁力调整的实际逻辑
  private performMagneticAdjustment = (draggedNode: NodeObject) => {
    const allNodes = [...this.nodes];
    const allLinks = [...this.links];
    const otherNodes = allNodes.filter((node) => node.id !== draggedNode.id);

    // 计算各种力，但只对非拖动节点应用
    const connectionForces = this.calculateConnectionForces(otherNodes, allLinks);

    // 计算相似度矩阵
    const similarities = new Map<string, Map<string, number>>();
    otherNodes.forEach((nodeA) => {
      const nodeAId = String(nodeA.id);
      const nodeASimilarities = new Map<string, number>();

      otherNodes.forEach((nodeB) => {
        if (nodeA.id !== nodeB.id) {
          const similarity = this.calculatePairwiseSimilarity(nodeA, nodeB);
          nodeASimilarities.set(String(nodeB.id), similarity);
        }
      });

      similarities.set(nodeAId, nodeASimilarities);
    });

    const similarityForces = this.calculateSimilarityForces(otherNodes, similarities);
    const repulsionForces = this.calculateRepulsionForces(allNodes); // 包含拖动节点以计算排斥

    // 对其他节点应用磁力调整
    otherNodes.forEach((node) => {
      const nodeId = String(node.id);

      let totalFx = 0;
      let totalFy = 0;

      // 连接力：如果与拖动节点有连接，则产生吸引力
      const connectionForce = connectionForces.get(nodeId);
      if (connectionForce) {
        // 检查是否与拖动节点有连接
        const connectedToDragged = allLinks.some(
          (link: LinkObject) =>
            (String(link.source) === nodeId && String(link.target) === String(draggedNode.id)) ||
            (String(link.target) === nodeId && String(link.source) === String(draggedNode.id)),
        );

        if (connectedToDragged) {
          // 计算朝向拖动节点的吸引力
          const dx = (draggedNode.x || 0) - (node.x || 0);
          const dy = (draggedNode.y || 0) - (node.y || 0);
          const distance = Math.sqrt(dx * dx + dy * dy);
          const idealDistance = 80; // 理想连接距离

          if (distance > idealDistance && distance > 0) {
            const attraction = Math.min((distance - idealDistance) * 0.02, 5);
            totalFx += (dx / distance) * attraction;
            totalFy += (dy / distance) * attraction;
          }
        }

        totalFx += connectionForce.fx * 0.3; // 降低权重避免过度调整
        totalFy += connectionForce.fy * 0.3;
      }

      // 相似力：相似节点被拖动节点吸引
      const similarityForce = similarityForces.get(nodeId);
      if (similarityForce) {
        const similarity = this.calculatePairwiseSimilarity(node, draggedNode);
        if (similarity > 0.3) {
          // 相似度阈值
          const dx = (draggedNode.x || 0) - (node.x || 0);
          const dy = (draggedNode.y || 0) - (node.y || 0);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const attraction = similarity * 0.5; // 根据相似度调整吸引力
            totalFx += (dx / distance) * attraction;
            totalFy += (dy / distance) * attraction;
          }
        }

        totalFx += similarityForce.fx * 0.15;
        totalFy += similarityForce.fy * 0.15;
      }

      // 排斥力：防止节点重叠
      const repulsionForce = repulsionForces.get(nodeId);
      if (repulsionForce) {
        totalFx += repulsionForce.fx * 0.4;
        totalFy += repulsionForce.fy * 0.4;
      }

      // 限制力的大小
      const maxDragForce = 3; // 拖动时力要温和一些
      totalFx = Math.max(-maxDragForce, Math.min(maxDragForce, totalFx));
      totalFy = Math.max(-maxDragForce, Math.min(maxDragForce, totalFy));

      // 应用力到节点位置（直接调整位置而不是速度）
      if (Math.abs(totalFx) > 0.1 || Math.abs(totalFy) > 0.1) {
        node.x = (node.x || 0) + totalFx;
        node.y = (node.y || 0) + totalFy;
      }
    });

    // 更新图形显示
    this.initData({ nodes: [...this.nodes], links: [...this.links] });
  };

  // 清理拖动磁力节流器
  cleanupDragMagneticForces = () => {
    if (this.dragMagneticThrottle) {
      clearTimeout(this.dragMagneticThrottle);
      this.dragMagneticThrottle = null;
    }
  };

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
