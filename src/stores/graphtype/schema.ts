import initShapes, { initShadowFilter } from '@/components/Shapes/Shapers';
import { ARROW_STYLE, COLOR_LIST, LINE_STYLE } from '@/components/Shapes/config';
import { IEdgeTypeItem, INodeTypeItem, IProperty, VisualInfo } from '@/interfaces';
import { RootStore } from '@/stores/index';
import { PropertyDataType, VisualEditorType } from '@/utils/constant';
import VEditor, { VEditorOptions } from '@vesoft-inc/veditor';
import { VEditorLine, VEditorNode } from '@vesoft-inc/veditor/types/Model/Schema';
import { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
import { InstanceNode } from '@vesoft-inc/veditor/types/Shape/Node';
import { AnyMap } from '@vesoft-inc/veditor/types/Utils';
import { makeAutoObservable, observable } from 'mobx';

type VEditorItem = InstanceNode | InstanceLine;

type SchemData = {
  nodes: VEditorNode[];
  lines: VEditorLine[];
};

const fromNode = new INodeTypeItem({
  name: 'from_node',
  properties: [
    new IProperty({
      name: 'id',
      type: PropertyDataType.INT,
      isPrimaryKey: true,
    }),
    new IProperty({
      name: 'name',
      type: PropertyDataType.STRING,
    }),
  ],
  labels: ['player', 'team'],
});

const toNode = new INodeTypeItem({
  name: 'toNode',
  properties: [
    new IProperty({
      name: 'id11',
      type: PropertyDataType.INT,
      isPrimaryKey: true,
    }),
    new IProperty({
      name: 'name11',
      type: PropertyDataType.STRING,
    }),
  ],
  labels: ['player', 'team'],
});

const mockEdgeType = new IEdgeTypeItem({
  name: 'nba_edge',
  properties: [
    new IProperty({
      name: 'id',
      type: PropertyDataType.INT,
      isPrimaryKey: true,
    }),
    new IProperty({
      name: 'name',
      type: PropertyDataType.STRING,
    }),
  ],
  labels: ['player', 'team'],
  srcNode: fromNode,
  dstNode: toNode,
});

class SchemaStore {
  rootStore?: RootStore;
  zoomFrame?: number;
  editor?: VEditor;
  container?: HTMLDivElement;
  hoveringItem?: VEditorItem;
  activeItem?: INodeTypeItem | IEdgeTypeItem;

  nodeTypeList: INodeTypeItem[];
  edgeTypeList: IEdgeTypeItem[];
  labelOptions: string[];

  constructor(rootStore?: RootStore) {
    this.rootStore = rootStore;
    this.nodeTypeList = [fromNode, toNode];
    this.edgeTypeList = [mockEdgeType];
    this.labelOptions = [];
    makeAutoObservable(this, {
      editor: observable.ref,
      container: observable.ref,
      hoveringItem: observable.ref,
      activeItem: observable.ref,
      zoomFrame: false,
      nodeTypeList: observable.shallow,
      edgeTypeList: observable.shallow,
      labelOptions: observable.shallow,
    });
  }

  addNodeType = (node: INodeTypeItem) => {
    this.nodeTypeList = this.nodeTypeList.concat(node);
    this.editor?.graph.node.addNode(this.parseNodeTypeToVNode(node, { ...node.style }));
  };

  updateNodeType = (id: string, node: Omit<INodeTypeItem, 'id'>) => {
    const nodeTypeItem = this.nodeTypeList.find((item) => item.id === id);
    if (nodeTypeItem) {
      nodeTypeItem.updateValues(node);
    }
    this.nodeTypeList = this.nodeTypeList.slice();
  };

  updateEdgeType = (id: string, edge: Omit<IEdgeTypeItem, 'id'>) => {
    const edgeTypeItem = this.edgeTypeList.find((item) => item.id === id);
    if (edgeTypeItem) {
      edgeTypeItem.updateValues(edge);
    }
    this.edgeTypeList = this.edgeTypeList.slice();
  };

  addEdgeType = (edge: IEdgeTypeItem) => {
    this.edgeTypeList = this.edgeTypeList.concat(edge);
  };

  addLabelOption = (label: string) => {
    this.labelOptions = this.labelOptions.concat(label);
  };

  deleteNodeType = (id: string) => {
    this.nodeTypeList = this.nodeTypeList.filter((node) => node.id !== id);
  };

  deleteEdgeType = (id: string) => {
    this.edgeTypeList = this.edgeTypeList.filter((edge) => edge.id !== id);
  };

  setActiveItem = (item?: INodeTypeItem | IEdgeTypeItem) => {
    this.activeItem = item;
  };

  setHoveringItem = (item: VEditorItem) => {
    this.hoveringItem = item;
  };

  initEditor(params: { container: HTMLDivElement; options?: Partial<VEditorOptions> }) {
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
  }

  updateEditor() {
    if (!this.editor || !this.container) return;
    const schemaData: SchemData = this.editor.schema.getData();
    this.updateGraphNodes(schemaData);
    this.updateGraphLines(schemaData);
    this.editor?.graph.update();
  }

  initGraphData() {
    if (!this.editor || !this.container) return;
    const schemaData: SchemData = { nodes: [], lines: [] };
    const controller = this.editor.controller;
    const rect = this.container.getBoundingClientRect();
    this.nodeTypeList.forEach((item, index) => {
      const style = COLOR_LIST[index % COLOR_LIST.length];
      const x = (rect.x - controller.x + index * 200) / controller.scale - 25 * controller.scale;
      const y = (rect.y - controller.y) / controller.scale - 25 * controller.scale;
      schemaData.nodes.push(this.parseNodeTypeToVNode(item, { x, y, ...style }));
    });
    this.edgeTypeList.forEach((item) => {
      schemaData.lines.push(this.parseEdgeTypeToVLine(item));
    });
    this.editor.schema.setInitData(schemaData);
  }

  private updateGraphNodes = (schemaData: SchemData) => {
    if (!this.editor || !this.container) return;
    this.nodeTypeList.forEach((item) => {
      const existNode = schemaData.nodes.find((n) => n.data?.id === item.id);
      if (existNode) {
        existNode.data = item as unknown as AnyMap;
      }
    });
  };

  private parseNodeTypeToVNode = (node: INodeTypeItem, style: VisualInfo = {}): VEditorNode => {
    return {
      uuid: node.id,
      type: VisualEditorType.Tag,
      name: node.name,
      data: node as unknown as AnyMap,
      ...style,
    };
  };

  private parseEdgeTypeToVLine = (edge: IEdgeTypeItem): VEditorLine => {
    return {
      uuid: edge.id,
      type: VisualEditorType.Edge,
      from: edge.srcNode?.id,
      to: edge.dstNode?.id,
      name: edge.name,
      data: edge as unknown as AnyMap,
      fromPoint: 0,
      toPoint: 0,
    };
  };

  private updateGraphLines = (schemaData: SchemData) => {
    if (!this.editor || !this.container) return;
    this.edgeTypeList.forEach((item) => {
      const existLine = schemaData.lines.find((n) => n.data?.id === item.id);
      if (existLine) {
        existLine.data = item as unknown as AnyMap;
        existLine.from = item.srcNode?.id;
        existLine.to = item.dstNode?.id;
      }
    });
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
        this.setActiveItem(node.data.data as unknown as INodeTypeItem);
      });
      this.editor.graph.on('node:remove', ({ node }: { node: InstanceNode }) => {
        const item = node.data.data as unknown as INodeTypeItem;
        this.deleteNodeType(item.id);
      });
      this.editor.graph.on('line:click', ({ line }: { line: InstanceLine }) => {
        this.setActiveItem(line.data.data as unknown as IEdgeTypeItem);
      });
      this.editor.graph.on('line:remove', ({ line }: { line: InstanceLine }) => {
        const item = line.data.data as unknown as IEdgeTypeItem;
        this.deleteNodeType(item.id);
      });
      this.editor.graph.on('line:add', ({ line }: { line: InstanceLine }) => {
        if (!this.editor) return;
        const fromNode = this.nodeTypeList.find((node) => node.id === line.from.nodeId);
        const toNode = this.nodeTypeList.find((node) => node.id === line.to.nodeId);
        if (fromNode && toNode) {
          const edgeItem = new IEdgeTypeItem({
            srcNode: fromNode,
            dstNode: toNode,
          });
          line.data.data = edgeItem as unknown as AnyMap;
          this.addEdgeType(edgeItem);
          this.setActiveItem(edgeItem);
        }
        // this.editor.graph.line.setActiveLine(line);
      });

      this.editor.graph.on('paper:click', () => {
        this.clearActive();
      });
      this.editor.graph.on('line:beforeadd', (line: InstanceLine) => {
        if (!this.editor) return;
        line.data.type = VisualEditorType.Edge;
        line.data.style = LINE_STYLE;
        line.data.arrowStyle = ARROW_STYLE;
        line.data.data = {
          name: '',
        };
      });
    }
  };

  clearActive = () => {
    if (!this.editor) return;
    this.setActiveItem(undefined);
    this.editor.graph.node.unActive();
    this.editor.graph.line.unActiveLine();
  };

  destroy = () => {
    this.editor?.destroy();
    this.editor = undefined;
    this.hoveringItem = undefined;
    this.activeItem = undefined;
  };
}

export default SchemaStore;
