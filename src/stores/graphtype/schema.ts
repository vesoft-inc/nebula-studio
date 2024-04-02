import type { AnyMap } from '@vesoft-inc/veditor/types/Utils';
import { type IReactionDisposer, computed, makeAutoObservable, observable, reaction } from 'mobx';
import VEditor, { type VEditorOptions } from '@vesoft-inc/veditor';
import type { VEditorLine, VEditorNode, VEditorSchema } from '@vesoft-inc/veditor/types/Model/Schema';
import type { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
import type { InstanceNode } from '@vesoft-inc/veditor/types/Shape/Node';

import initShapes, { initShadowFilter } from '@/components/Shapes/Shapers';
import { ARROW_STYLE, COLOR_LIST, LINE_STYLE } from '@/components/Shapes/config';
import {
  DescEdgeTypeResult,
  DescGraphTypeResult,
  DescNdoeTypeResult,
  IEdgeTypeItem,
  INodeTypeItem,
  IProperty,
  VisualInfo,
} from '@/interfaces';
import { GQLResult } from '@/interfaces/console';
import { execGql } from '@/services';
import { RootStore } from '@/stores/index';
import { EdgeDirectionType, MultiEdgeKeyMode, VisualEditorType } from '@/utils/constant';

type VEditorItem = InstanceNode | InstanceLine;

const ForwardEdgePattern = /\((.*?)\)-\[(.*?)\]->\((.*?)\)/;
const BackwordEdgePattern = /\((.*?)\)<-\[(.*?)\]-\((.*?)\)/;
const UndirectedEdgePattern = /\((.*?)\)-\[(.*?)\]-\((.*?)\)/;

export type ActiveItemInfo =
  | { type: VisualEditorType.Edge; value: IEdgeTypeItem }
  | { type: VisualEditorType.Tag; value: INodeTypeItem };

class SchemaStore {
  rootStore?: RootStore;
  zoomFrame?: number;
  editor?: VEditor;
  container?: HTMLDivElement;
  hoveringItem?: VEditorItem;
  activeItem?: ActiveItemInfo;
  nodeTypeList = observable.array<INodeTypeItem>([]);
  edgeTypeList = observable.array<IEdgeTypeItem>([]);

  reactionDisposer?: IReactionDisposer;
  activeItemDisposer?: IReactionDisposer;

  constructor(rootStore?: RootStore, graphtype?: string) {
    this.rootStore = rootStore;
    makeAutoObservable(this, {
      editor: observable.ref,
      container: observable.ref,
      hoveringItem: observable.ref,
      activeItem: observable.ref,
      zoomFrame: false,
      nodeTypeLabeList: computed,
      edgeTypeLabelList: computed,
    });
    this.initReactions();
    if (graphtype) {
      this.transformGrapTypeByDDL(graphtype);
    }
  }

  get nodeTypeLabeList() {
    return Array.from(new Set(this.nodeTypeList.map((node) => node.labels).reduce((acc, cur) => acc.concat(cur), [])));
  }

  get edgeTypeLabelList() {
    return Array.from(new Set(this.edgeTypeList.map((edge) => edge.labels).reduce((acc, cur) => acc.concat(cur), [])));
  }

  updateNodeTypeList = (nodeTypeList: INodeTypeItem[]) => {
    this.nodeTypeList.replace(nodeTypeList);
  };

  updateEdgeTypeList = (edgeTypeList: IEdgeTypeItem[]) => {
    this.edgeTypeList.replace(edgeTypeList);
  };

  transformGrapTypeByDDL = async (graphType: string) => {
    const gql = `CALL describe_graph_type("${graphType}") RETURN *`;
    const res = await execGql<GQLResult<DescGraphTypeResult>>(gql);
    if (res.code === 0) {
      const nodeTypes: INodeTypeItem[] = [];
      const edgeTypes: IEdgeTypeItem[] = [];
      // get node type list
      (res.data?.tables || []).forEach((item) => {
        const { labels, type, type_name } = item;
        if (type === 'Node') {
          nodeTypes.push(
            new INodeTypeItem({
              name: type_name,
              labels,
              properties: [],
              style: this.#getInitNodeStyle(nodeTypes.length),
            })
          );
        }
      });
      // get edgeType List
      (res.data?.tables || []).forEach((item) => {
        const { labels, type, type_name } = item;
        if (type === 'Edge') {
          const info = this.#extractEdgeByEdgeTypeName(type_name);
          if (info) {
            edgeTypes.push(
              new IEdgeTypeItem({
                name: info.name,
                srcNode: nodeTypes.find((node) => node.name === info.fromNodeName),
                dstNode: nodeTypes.find((node) => node.name === info.dstNodeName),
                direction: info.direction,
                labels,
                properties: [],
              })
            );
          }
        }
      });

      // desc node type
      const descNodeTypePromises = nodeTypes.map(
        (nodeType) =>
          new Promise((resolve, reject) => {
            const gql = `DESC NODE TYPE ${nodeType.name} of ${graphType}`;
            execGql<GQLResult<DescNdoeTypeResult>>(gql)
              .then((res) => {
                if (res.code === 0) {
                  const properties: IProperty[] = [];
                  res.data?.tables?.forEach((item) => {
                    const { property_name, data_type, primary_key, nullable, default: _default } = item;
                    properties.push(
                      new IProperty({
                        name: property_name,
                        type: data_type,
                        isPrimaryKey: primary_key === 'Y',
                        nullable,
                        default: _default,
                      })
                    );
                  });
                  nodeType.properties = properties;
                  resolve(0);
                }
              })
              .catch((err) => reject(err));
          })
      );

      const descEdgeTypePromises = edgeTypes.map(
        (edgeType) =>
          new Promise((resolve, reject) => {
            const gql = `DESC EDGE TYPE ${edgeType.name} of ${graphType}`;
            execGql<GQLResult<DescEdgeTypeResult>>(gql)
              .then((res) => {
                if (res.code === 0) {
                  const properties: IProperty[] = [];
                  res.data?.tables?.forEach((item) => {
                    const { property_name, data_type, multi_edge_key, nullable, default: _default } = item;
                    properties.push(
                      new IProperty({
                        name: property_name,
                        type: data_type,
                        multiEdgeKey: multi_edge_key === 'Y',
                        nullable,
                        default: _default,
                      })
                    );
                  });
                  edgeType.properties = properties;
                  edgeType.multiEdgeKeyMode = MultiEdgeKeyMode.Auto;
                  resolve(0);
                }
              })
              .catch((err) => reject(err));
          })
      );

      await Promise.all(descNodeTypePromises).then(() => {});
      await Promise.all(descEdgeTypePromises).then(() => {});
      this.updateNodeTypeList(nodeTypes);
      this.updateEdgeTypeList(edgeTypes);
    }
  };

  #extractEdgeByEdgeTypeName = (edgeTypeName: string) => {
    const arrs = [ForwardEdgePattern, BackwordEdgePattern, UndirectedEdgePattern];
    for (let i = 0; i < arrs.length; i++) {
      const pattern = arrs[i];
      const matched = edgeTypeName.match(pattern);
      if (!matched) continue;
      const [fromNodeName, name, dstNodeName] = matched.slice(1);
      return {
        fromNodeName,
        name,
        dstNodeName,
        direction: [EdgeDirectionType.Forward, EdgeDirectionType.Backword, EdgeDirectionType.Undirected][i],
      };
    }
    return undefined;
  };

  addNodeType = (node: INodeTypeItem) => {
    const style = {
      ...this.#getInitNodeStyle(this.nodeTypeList.length),
      ...node.style,
    };
    node.style = style;
    this.nodeTypeList.push(node);
  };

  initReactions = () => {
    this.reactionDisposer = reaction(
      () => [this.nodeTypeList.length, this.edgeTypeList.length],
      () => {
        this.updateEditor();
      }
    );

    this.activeItemDisposer = reaction(
      () => this.activeItem,
      () => {
        if (this.activeItem?.type === VisualEditorType.Tag) {
          const item = this.nodeTypeList.find((node) => node.id === this.activeItem?.value.id);
          item?.updateValues(this.activeItem?.value as INodeTypeItem);
        }
        if (this.activeItem?.type === VisualEditorType.Edge) {
          const item = this.edgeTypeList.find((edge) => edge.id === this.activeItem?.value.id);
          item?.updateValues(this.activeItem?.value as IEdgeTypeItem);
        }
        this.#updateGraphNodeActive();
        this.updateEditor();
      }
    );
  };

  #updateGraphNodeActive = () => {
    if (this.activeItem?.type === VisualEditorType.Tag) {
      const node = this.editor?.graph.node.nodes[this.activeItem.value.id];
      if (node) {
        this.editor?.graph.node.setActive(node);
      }
    }
  };

  updateEditor = () => {
    if (!this.editor || !this.container) return;
    this.#updateGraphNodes(this.editor?.schema.data);
    this.#updateGraphLines(this.editor?.schema.data);
    this.editor?.graph.update();
  };

  #updateGraphNodes = (schema: VEditorSchema) => {
    if (!this.editor || !this.container) return;
    const nodesMap = schema.nodesMap;
    this.nodeTypeList.forEach((item) => {
      const existNode = nodesMap[item.id];
      if (existNode) {
        existNode.data = item as unknown as AnyMap;
      } else {
        this.editor?.graph.node.addNode(this.#parseNodeTypeToVNode(item));
      }
    });
  };

  #updateGraphLines = (schema: VEditorSchema) => {
    if (!this.editor || !this.container) return;
    const linesMap = schema.linesMap;
    this.edgeTypeList.forEach((item) => {
      const vedgeId = Object.keys(linesMap).find((key) => linesMap[key].data?.id === item.id);
      const existLine = vedgeId ? linesMap[vedgeId] : undefined;
      if (existLine) {
        (existLine.data as unknown as IEdgeTypeItem)?.updateValues(item);
        existLine.from = item.srcNode?.id;
        existLine.to = item.dstNode?.id;
        existLine.name = item.name;
        existLine.style = {
          ...LINE_STYLE,
          stroke: item.style?.strokeColor,
        };
        if (item.direction === EdgeDirectionType.Backword) {
          existLine.to = item.srcNode?.id;
          existLine.from = item.dstNode?.id;
        } else {
          existLine.from = item.srcNode?.id;
          existLine.to = item.dstNode?.id;
        }
      } else {
        this.editor?.graph.line.addLine(this.#parseEdgeTypeToVLine(item));
      }
    });
  };

  updateNodeType = (id: string, node: INodeTypeItem) => {
    this.nodeTypeList.find((node) => node.id === id)?.updateValues(node);
  };

  setActiveItem = (info?: ActiveItemInfo) => {
    this.activeItem = info;
  };

  updateActiveItem = () => {
    this.activeItem = {
      ...this.activeItem,
    } as ActiveItemInfo;
  };

  updateEdgeType = (id: string, edge: Omit<IEdgeTypeItem, 'id'>) => {
    this.edgeTypeList.find((edge) => edge.id === id)?.updateValues(edge);
  };

  addEdgeType = (edge: IEdgeTypeItem) => {
    this.edgeTypeList.push(edge);
  };

  deleteNodeType = (item: INodeTypeItem) => {
    this.nodeTypeList.remove(item);
  };

  deleteEdgeType = (item: IEdgeTypeItem) => {
    this.edgeTypeList.remove(item);
  };

  setHoveringItem = (item: VEditorItem) => {
    this.hoveringItem = item;
  };

  initEditor = (params: { container: HTMLDivElement; options?: Partial<VEditorOptions> }) => {
    const { container, options } = params;
    this.editor = new VEditor({
      dom: container,
      showBackGrid: false,
      ...options,
    });
    this.container = container;
    initShapes(this.editor, this.rootStore!.themeStore.theme);
    initShadowFilter(this.editor);
    this.initEvents(options?.mode);
    this.initGraphData();
  };

  initGraphData() {
    if (!this.editor || !this.container) return;
    const schemaData: { nodes: VEditorNode[]; lines: VEditorLine[] } = { nodes: [], lines: [] };
    this.nodeTypeList.forEach((node) => {
      schemaData.nodes.push(this.#parseNodeTypeToVNode(node));
    });
    this.edgeTypeList.forEach((edge) => {
      schemaData.lines.push(this.#parseEdgeTypeToVLine(edge));
    });
    this.editor.schema.setData(schemaData);
  }

  #getInitNodeStyle = (index: number) => {
    if (!this.container) return;
    const controller = this.editor?.controller || { x: 0, y: 0, scale: 1 };
    const rect = this.container.getBoundingClientRect();
    const style = COLOR_LIST[index % COLOR_LIST.length];
    const x = (Math.max(rect.width, 800) / 2 + index * 200 - controller.x) / controller.scale;
    const y = (Math.max(rect.height, 600) / 2 - controller.y) / controller.scale;
    return { x, y, ...style };
  };

  #parseNodeTypeToVNode = (node: INodeTypeItem, style: VisualInfo = {}): VEditorNode => {
    return {
      uuid: node.id,
      type: VisualEditorType.Tag,
      name: node.name,
      data: node as unknown as AnyMap,
      ...node.style,
      ...style,
    };
  };

  #parseEdgeTypeToVLine = (edge: IEdgeTypeItem): VEditorLine => {
    let ponits = { fromPoint: 0, toPoint: 0 };
    if (edge.srcNode.id === edge.dstNode.id) {
      ponits = { fromPoint: 0, toPoint: 1 };
    }
    return {
      uuid: edge.id,
      type: VisualEditorType.Edge,
      from: edge.srcNode?.id,
      to: edge.dstNode?.id,
      name: edge.name,
      data: edge as unknown as AnyMap,
      style: {
        stroke: edge.style?.strokeColor,
        strokeWith: 1.6,
      },
      ...ponits,
    };
  };

  zoomIn = () => {
    if (!this.editor) return;
    const { clientWidth, clientHeight } = this.editor.svg;
    if (this.zoomFrame === undefined) {
      document.addEventListener('mouseup', this.zoomMouseUp);
    }
    this.editor.controller.zoom(0.95, clientWidth / 2, clientHeight / 2);
    this.zoomFrame = requestAnimationFrame(() => {
      this.zoomIn();
    });
  };

  zoomOut = () => {
    if (!this.editor) return;
    const { clientWidth, clientHeight } = this.editor.svg;
    if (this.zoomFrame === undefined) {
      document.addEventListener('mouseup', this.zoomMouseUp);
    }
    this.editor.controller.zoom(1.05, clientWidth / 2, clientHeight / 2);
    this.zoomFrame = requestAnimationFrame(() => {
      this.zoomOut();
    });
  };

  zoomMouseUp = () => {
    if (!this.zoomFrame) return;
    cancelAnimationFrame(this.zoomFrame);
    this.zoomFrame = undefined;
    document.removeEventListener('mouseup', this.zoomMouseUp);
  };

  initEvents = (mode: VEditorOptions['mode']) => {
    if (!this.editor) return;
    if (mode === 'edit') {
      this.editor.graph.on('node:click', ({ node }: { node: InstanceNode }) => {
        this.setActiveItem({
          type: VisualEditorType.Tag,
          value: node.data.data as unknown as INodeTypeItem,
        });
      });
      this.editor.graph.on('node:move', ({ node }: { node: InstanceNode }) => {
        const { x, y } = node.data;
        const item = node.data.data as unknown as INodeTypeItem;
        item.style = {
          ...item.style,
          x,
          y,
        };
      });
      this.editor.graph.on('node:remove', ({ node }: { node: InstanceNode }) => {
        const item = node.data.data as unknown as INodeTypeItem;
        this.deleteNodeType(item);
      });
      this.editor.graph.on('line:click', ({ line }: { line: InstanceLine }) => {
        this.setActiveItem({
          type: VisualEditorType.Edge,
          value: line.data.data as unknown as IEdgeTypeItem,
        });
      });
      this.editor.graph.on('line:move', ({ line }: { line: InstanceNode }) => {
        const { x, y } = line.data;
        const item = line.data.data as unknown as IEdgeTypeItem;
        item.style = {
          ...item.style,
          x,
          y,
        };
      });
      this.editor.graph.on('line:remove', ({ line }: { line: InstanceLine }) => {
        const item = line.data.data as unknown as IEdgeTypeItem;
        this.deleteEdgeType(item);
      });
      this.editor.graph.on('line:add', ({ line }: { line: InstanceLine }) => {
        if (!this.editor) return;
        // if (this.edgeTypeList.find((edge) => edge.id === line.data.uuid)) return;
        if (line.data.data) return;
        const schemaData = this.editor.schema.getData();
        const fromNode = schemaData.nodes.find((node) => node.data?.id === line.from.nodeId)
          ?.data as unknown as INodeTypeItem;
        const toNode = schemaData.nodes.find((node) => node.data?.id === line.to.nodeId)
          ?.data as unknown as INodeTypeItem;
        if (fromNode && toNode) {
          const edgeItem = new IEdgeTypeItem({
            srcNode: fromNode,
            dstNode: toNode,
          });
          edgeItem.style = {
            strokeColor: (line.data?.style as Record<'stroke', string>)?.stroke,
          };
          line.data.name = '';
          line.data.data = edgeItem as unknown as AnyMap;
          this.addEdgeType(edgeItem);
          this.clearActive();
          this.editor?.graph.line.setActiveLine(line);
          this.setActiveItem({
            type: VisualEditorType.Edge,
            value: edgeItem,
          });
        }
      });

      this.editor.graph.on('line:beforeadd', (line: InstanceLine) => {
        if (!this.editor) return;
        line.data.type = VisualEditorType.Edge;
        line.data.style = LINE_STYLE;
        line.data.arrowStyle = ARROW_STYLE;
        // (line.data.data as unknown as IEdgeTypeItem) = new IEdgeTypeItem();
      });

      this.editor.graph.on('paper:click', () => {
        this.clearActive();
      });
    }
  };

  clearActive = () => {
    if (!this.editor) return;
    this.setActiveItem(undefined);
    this.editor.graph.node.unActive();
    this.editor.graph.line.unActiveLine();
  };

  destroyEditor = () => {
    this.editor?.destroy();
    this.editor = undefined;
    this.hoveringItem = undefined;
    this.activeItem = undefined;
  };

  disposeReaction = () => {
    this.reactionDisposer?.();
    this.reactionDisposer = undefined;
    this.activeItemDisposer?.();
    this.activeItemDisposer = undefined;
  };
}

export default SchemaStore;
