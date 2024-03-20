import initShapes, { initShadowFilter } from '@/components/Shapes/Shapers';
import { ARROW_STYLE, LINE_STYLE } from '@/components/Shapes/config';
import { GraphTypeElement, INodeTypeItem, IProperty } from '@/interfaces';
import { RootStore } from '@/stores/index';
import { PropertyDataType, VisualEditorType } from '@/utils/constant';
import VEditor, { VEditorOptions } from '@vesoft-inc/veditor';
import { InstanceLine } from '@vesoft-inc/veditor/types/Shape/Line';
import { InstanceNode } from '@vesoft-inc/veditor/types/Shape/Node';
import { makeObservable, observable } from 'mobx';

type VEditorItem = InstanceNode | InstanceLine;

type UpdatePayload = Partial<{
  hoveringItem: VEditorItem;
  activeItem: VEditorItem;
}>;

class SchemaStore {
  rootStore?: RootStore;
  zoomFrame?: number;
  editor?: VEditor;
  container?: HTMLDivElement;
  hoveringItem?: VEditorItem;
  activeItem?: VEditorItem;

  nodeTypeList: INodeTypeItem[];
  edgeTypeList: GraphTypeElement[];

  labelOptions: string[];

  constructor(rootStore?: RootStore) {
    this.rootStore = rootStore;
    // this.nodeTypeList = [];
    this.nodeTypeList = [
      {
        name: 'nba_type',
        primaryKey: 'id',
        properties: [
          new IProperty({
            name: 'id',
            type: PropertyDataType.INT,
          }),
          new IProperty({
            name: 'name',
            type: PropertyDataType.STRING,
          }),
        ],
        labels: ['player', 'team'],
      },
      {
        name: 'nba_type',
        primaryKey: 'id',
        properties: [
          new IProperty({
            name: 'id',
            type: PropertyDataType.INT,
          }),
          new IProperty({
            name: 'name',
            type: PropertyDataType.STRING,
          }),
        ],
        labels: ['player', 'team'],
      },
    ];
    this.edgeTypeList = [];
    this.labelOptions = [];
    makeObservable(this, {
      editor: observable.ref,
      container: observable.ref,
      hoveringItem: observable.ref,
      activeItem: observable.shallow,
      zoomFrame: false,
      nodeTypeList: observable.shallow,
      edgeTypeList: observable.shallow,
      labelOptions: observable.shallow,
    });
  }

  addNodeType = (node: INodeTypeItem) => {
    this.nodeTypeList = this.nodeTypeList.concat(node);
  };

  addEdgeType = (edge: GraphTypeElement) => {
    this.edgeTypeList = this.edgeTypeList.concat(edge);
  };

  addLabelOption = (label: string) => {
    this.labelOptions = this.labelOptions.concat(label);
  };

  deleteNodeType = (name: string) => {
    const index = this.nodeTypeList.findIndex((node) => node.name === name);
    if (index !== -1) {
      this.nodeTypeList.splice(index, 1);
    }
  };

  deleteEdgeType = (name: string) => {
    const index = this.edgeTypeList.findIndex((edge) => edge.name === name);
    if (index !== -1) {
      this.edgeTypeList.splice(index, 1);
    }
  };

  setActiveItem = (item?: VEditorItem) => {
    this.activeItem = item;
  };

  setHoveringItem = (item: VEditorItem) => {
    this.hoveringItem = item;
  };

  initEditor(params: { container: HTMLDivElement; schema?: string; options?: Partial<VEditorOptions> }) {
    const { container, schema, options } = params;
    this.editor = new VEditor({
      dom: container,
      showBackGrid: false,
      disableCopy: true,
      ...options,
    });
    this.container = container;
    initShapes(this.editor, this.rootStore!.themeStore.theme);
    initShadowFilter(this.editor);
    if (schema) {
      // todo set schema
    }
    this.initEvents(options?.mode);
  }

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
        this.setActiveItem(node);
      });
      this.editor.graph.on('line:click', ({ line }: { line: InstanceLine }) => {
        this.setActiveItem(line);
      });
      this.editor.graph.on('line:add', ({ line }: { line: InstanceLine }) => {
        if (!this.editor) return;
        this.editor.graph.line.update();
        this.setActiveItem(line);
        this.clearActive();
        this.editor.graph.line.setActiveLine(line);
      });
      this.editor.graph.on('paper:click', () => {
        this.setActiveItem(undefined);
      });
      this.editor.graph.on('line:beforeadd', ({ line }: { line: InstanceLine }) => {
        if (!this.editor) return;
        // const data = this.editor.schema.getData();
        // makeLineSort([...data.lines, line]);
        line.type = VisualEditorType.Edge;
        line.style = LINE_STYLE;
        line.arrowStyle = ARROW_STYLE;
      });
      this.editor.graph.on('node:remove', ({ node }: { node: InstanceNode }) => {
        const param: UpdatePayload = { activeItem: undefined };
        if (this.hoveringItem?.data.uuid === node.data.uuid) {
          param.hoveringItem = undefined;
        }
        this.setActiveItem(param.activeItem);
        this.setHoveringItem(param.hoveringItem!);
        // this.validateSameNameData();
      });
      this.editor.graph.on('line:remove', ({ line }: { line: InstanceLine }) => {
        if (!this.editor) return;
        // const data = this.editor.schema.getData();
        // makeLineSort(data.lines);
        this.editor.graph.line.update();
        const param: UpdatePayload = { activeItem: undefined };
        if (this.hoveringItem?.data.uuid === line.data.uuid) {
          param.hoveringItem = undefined;
        }
        this.setActiveItem(param.activeItem);
        this.setHoveringItem(param.hoveringItem!);
        // this.validateSameNameData();
      });
    }
  };

  clearActive = () => {
    if (!this.editor) return;
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
