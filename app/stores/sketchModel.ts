import { makeAutoObservable, observable, action } from 'mobx';
import { getRootStore } from '@app/stores';
import VEditor from '@vesoft-inc/veditor';
import { ISketch, ISketchEdge, ISketchNode, ISketchType } from '@app/interfaces/sketch';
import initShapes, { initShadowFilter } from '@app/pages/SketchModeling/Plugins/SketchShapes/Shapers';
import service from '@app/config/service';
import { Pointer } from '@app/interfaces/graph';

interface IHoveringItem {
  data: ISketchNode | ISketchEdge;
}
export class SketchStore {
  loading: boolean = false;
  editor: VEditor;
  container: HTMLDivElement;
  draggingNewTag: any;
  active?: ISketchNode | ISketchEdge;
  hoveringItem: IHoveringItem;
  draggingPosition = {
    x: 0,
    y: 0,
  };
  zoomFrame: number;
  tooltip: Pointer = {
    top: 0,
    left: 0,
    event: undefined,
    showContextMenu: false,
    hideContextMenu: false,
  };
  sketchList = {
    items: observable.array<ISketch>([]),
    filter: {
      keyword: '',
    },
    pageSize: 999,
    total: null,
    page: 1,
  };
  currentSketch: ISketch;
  get rootStore() {
    return getRootStore();
  }

  constructor() {
    makeAutoObservable(this, {
      loading: observable,
      container: false,
      zoomFrame: false,
      draggingNewTag: observable.ref,
      tooltip: observable.ref,
      active: observable.shallow,
      update: action,
      sketchList: observable.deep,
    });
  }

  update = (payload: Record<string, any>) => {
    Object.keys(payload).forEach(
      (key) => Object.prototype.hasOwnProperty.call(this, key) && (this[key] = payload[key])
    );
  };

  initSketch = async () => {
    const initData = {
      name: `Schema_${Date.now()}`,
      schema: '',
      snapshot: '',
    };
    const { code, data } = await service.initSketch(initData);
    if (code === 0) {
      return data.id;
    }
    return null;
  };

  deleteSketch = async (id: string) => {
    const { code } = await service.deleteSketch(id);
    return code === 0;
  };

  updateSketch = async (params: { name?: string; schema?: string; snapshot?: string }) => {
    const { id, name, schema, snapshot } = this.currentSketch;
    const { code } = await service.updateSketch({
      id,
      name,
      schema,
      snapshot,
      ...params,
    });
    return code;
  };

  getSketchList = async (params?: { page?: number; pageSize?: number; keyword?: string }) => {
    const { page, pageSize, filter } = this.sketchList;
    const _params = {
      page,
      pageSize,
      ...filter,
      ...params,
    };
    const newFilter = { keyword: params?.keyword ?? filter.keyword };
    this.update({ loading: true });
    const res = await service.getSketchList(_params);
    this.update({ loading: false });
    if (res.code === 0) {
      const sketchList = { ...res.data, filter: newFilter };
      this.update({ sketchList });
      return sketchList;
    }
  };

  initEditor = async (container: HTMLDivElement, schema?: string) => {
    this.editor = new VEditor({
      dom: container,
      showBackGrid: false,
    });
    this.container = container;
    initShapes(this.editor);
    initShadowFilter(this.editor.svg);
    this.initEvents();
    if (schema) {
      this.editor.schema.setData(JSON.parse(schema));
    }
  };
  clearActive = () => {
    this.editor.graph.node.unActive();
    this.editor.graph.line.unActiveLine();
  };
  initEvents = () => {
    this.editor.graph.on('node:click', ({ node }) => {
      this.update({ active: node.data });
    });
    this.editor.graph.on('node:change', ({ node }) => {
      this.update({ active: node.data });
      this.clearActive();
      this.editor.graph.node.setActive(node);
    });
    this.editor.graph.on('line:click', ({ line }) => {
      this.update({ active: line.data });
    });
    this.editor.graph.on('line:add', ({ line }) => {
      this.update({ active: line.data });
      this.clearActive();
      this.editor.graph.line.setActiveLine(line);
    });
    this.editor.graph.on('paper:click', () => {
      this.update({ active: undefined });
    });
    this.editor.graph.on('line:beforeadd', ({ data: line }: { data: any }) => {
      line.type = ISketchType.SketchLine;
      line.style = {
        'stroke-width': 1.6,
        stroke: 'rgba(99, 111, 129, 0.8)',
      };
      line.arrowStyle = {
        'stroke-width': 1.6,
        stroke: 'rgba(99, 111, 129, 0.8)',
        fill: 'transparent',
        d: 'M-7 7L0 0L7 7',
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
      };
    });
    this.editor.graph.on('node:remove', ({ node }) => {
      this.update({ active: undefined });
    });
    this.editor.graph.on('line:remove', () => {
      this.update({ active: undefined });
    });

    this.editor.graph.on('node:mouseenter', ({ node }) => {
      this.update({ hoveringItem: node });
    });
    this.editor.graph.on('line:mouseenter', ({ line }) => {
      this.update({ hoveringItem: line });
    });
    this.editor.graph.on('node:mouseleave', () => {
      this.update({ hoveringItem: undefined });
    });
    this.editor.graph.on('line:mouseleave', () => {
      this.update({ hoveringItem: undefined });
    });
  };

  setHoveringItem = (item?: IHoveringItem) => {
    if (item === this.hoveringItem) return;
    this.update({ hoveringItem: item || undefined });
  };

  addNode = (e: React.MouseEvent) => {
    if (this.draggingNewTag) {
      const { container } = this;
      const { controller } = this.editor;
      const rect = container.getBoundingClientRect();
      if (e.clientX - rect.x < 0 || e.clientY - rect.y < 0) {
        this.draggingNewTag = undefined;
        return;
      }
      const x = (e.clientX - rect.x - controller.x) / controller.scale - 25 * controller.scale;
      const y = (e.clientY - rect.y - controller.y) / controller.scale - 25 * controller.scale;
      const node = {
        x,
        y,
        width: 83,
        height: 83,
        name: undefined,
        ...this.draggingNewTag,
      };
      this.editor.graph.node.addNode(node);
      this.draggingNewTag = undefined;
    }
  };

  updateItem = (node: ISketchNode | ISketchEdge, payload: Record<string, any>) => {
    Object.keys(payload).forEach((key) => (node[key] = payload[key]));
    const graph = this.editor.graph;
    const originalData =
      node.type === ISketchType.SketchLine ? graph.line.lines[node.uuid].data : graph.node.nodes[node.uuid].data;
    Object.assign(originalData, { ...payload });
  };

  duplicateNode = () => {
    const { x, y, name, ...others } = this.active as ISketchNode;
    this.editor.graph.node.addNode({
      x: x + 40,
      y: y + 40,
      name: `${name || ''}(1)`,
      ...others,
    });
  };

  deleteElement = (type) => {
    if (type === ISketchType.SketchNode) {
      this.editor.graph.node.deleteNode(this.active.uuid);
    } else {
      this.editor.graph.line.deleteLine(this.active.uuid);
    }
  };

  zoomOut = () => {
    const { clientWidth, clientHeight } = this.editor.svg;
    if (this.zoomFrame === undefined) {
      document.addEventListener('mouseup', this.zoomMouseUp);
    }
    this.editor.controller.zoom(0.95, clientWidth / 2, clientHeight / 2);
    this.zoomFrame = requestAnimationFrame(() => {
      this.zoomOut();
    });
  };
  zoomIn = () => {
    const { clientWidth, clientHeight } = this.editor.svg;
    if (this.zoomFrame === undefined) {
      document.addEventListener('mouseup', this.zoomMouseUp);
    }
    this.editor.controller.zoom(1.05, clientWidth / 2, clientHeight / 2);
    this.zoomFrame = requestAnimationFrame(() => {
      this.zoomIn();
    });
  };
  zoomMouseUp = () => {
    cancelAnimationFrame(this.zoomFrame);
    this.zoomFrame = undefined;
    document.removeEventListener('mouseup', this.zoomMouseUp);
  };
  setTooltip = (tooltip: any) => {
    // The offset of the canvas relative to the page
    const offsetX = 258;
    const offsetY = 120;
    const { left, top } = tooltip;
    this.tooltip = { ...this.tooltip, left: left - offsetX, top: top - offsetY };
  };
  destroy = () => {
    this.editor.destroy();
    this.editor = undefined;
  };
}

const sketchStore = new SketchStore();

export default sketchStore;
