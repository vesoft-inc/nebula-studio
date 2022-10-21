import { makeAutoObservable, observable, action } from 'mobx';
import { message } from 'antd';
import intl from 'react-intl-universal';
import { getRootStore } from '@app/stores';
import VEditor, { VEditorOptions } from '@vesoft-inc/veditor';
import { ISketch, ISketchEdge, ISketchNode } from '@app/interfaces/sketch';
import initShapes, { initShadowFilter } from '@app/pages/SketchModeling/Plugins/SketchShapes/Shapers';
import service from '@app/config/service';
import { Pointer } from '@app/interfaces/graph';
import { v4 as uuidv4 } from 'uuid';

import { IProperty, ISchemaEnum } from '@app/interfaces/schema';
import { ARROW_STYLE, LINE_STYLE, makeLineSort, NODE_RADIUS } from '@app/config/sketch';
import { uniqBy } from 'lodash';
import { MAX_COMMENT_BYTES } from '@app/utils/constant';
import { getByteLength } from '@app/utils/function';

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

  validate = (data, type) => {
    const { name, comment, properties } = data;
    let isInvalid = !name || (properties as IProperty[])?.some((i) => !i.name || !i.type);
    const uniqProperties = uniqBy(data.properties, 'name');
    if(properties && data.properties?.length !== uniqProperties.length) {
      isInvalid = true;
    }
    if(comment) {
      const byteLength = getByteLength(comment);
      byteLength > MAX_COMMENT_BYTES && (isInvalid = true);
    }
    if (isInvalid) {
      this.updateItem(data as any, { invalid: true });
      if (type === 'node') {
        this.editor.graph.node.updateNode(this.editor.graph.node.nodes[data.uuid].data, true);
      } else {
        this.editor.graph.line.updateLine(this.editor.graph.line.lines[data.uuid].data, true);
      }
    }
    if (this.active?.uuid === data.uuid) {
      this.update({ active: { ...this.active, invalid: isInvalid } });
    }
    return !isInvalid;
  };

  validateSchema = () => {
    const data = this.editor.schema.getData();
    const { nodes, lines } = data;
    const nodesValid = nodes.reduce((flag, node) => this.validate(node, 'node') && flag, true);
    const edgesValid = lines.reduce((flag, line) => this.validate(line, 'edge') && flag, true);
    const hasSameName = this.checkSameName();
    if(nodesValid && edgesValid && !hasSameName) {
      return true;
    }
    hasSameName ? message.error(intl.get('sketch.uniqName')) : message.error(intl.get('sketch.sketchInvalid'));
    return false;
  };

  checkSameName = () => {
    const data = this.editor.schema.getData();
    const { nodes, lines } = data;
    const _nodes = nodes.map((i) => i.name).filter(Boolean);
    const _lines = lines.map((i) => i.name).filter(Boolean);
    const name = new Set([..._nodes, ..._lines]);
    return name.size !== _nodes.length + _lines.length;
  };

  checkModified = () => {
    const initialData = this.sketchList.items.find((item) => item.id === this.currentSketch?.id);
    const schema = this.editor.schema.getData();
    const isEmptySame = !schema.nodes.length && !schema.lines.length && !initialData.schema;
    const newSchema = JSON.stringify({
      nodes: schema.nodes?.map(node => ({ name: node.name, properties: node.properties, comment: node.comment })),
      lines: schema.lines?.map(line => ({ name: line.name, from: line.from, to: line.to, properties: line.properties, comment: line.comment })),
    });
    let prevSchema = JSON.parse(initialData.schema || '{}');
    prevSchema = JSON.stringify({
      nodes: prevSchema.nodes?.map(node => ({ name: node.name, properties: node.properties, comment: node.comment })),
      lines: prevSchema.lines?.map(line => ({ name: line.name, from: line.from, to: line.to, properties: line.properties, comment: line.comment })),
    });
    return (!isEmptySame && newSchema !== prevSchema) || initialData.name !== this.currentSketch.name;
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
      const params = { sketchList } as any;
      if(this.currentSketch) {
        params.currentSketch = sketchList.items.find((item) => item.id === this.currentSketch.id);
      }
      this.update(params);
      return sketchList;
    }
  };

  initEditor = async (params: {container: HTMLDivElement, schema?: string, options?: VEditorOptions }) => {
    const { container, schema, options } = params;
    this.editor = new VEditor({
      dom: container,
      showBackGrid: false,
      ...options
    });
    this.container = container;
    initShapes(this.editor);
    initShadowFilter(this.editor.svg);
    this.initEvents(options?.mode);
    if (schema) {
      const _schema = JSON.parse(schema);
      makeLineSort(_schema.lines);
      await this.editor.schema.setInitData(_schema);
      this.editor.controller.autoFit();
    }
  };
  clearActive = () => {
    this.editor.graph.node.unActive();
    this.editor.graph.line.unActiveLine();
  };
  initEvents = (mode) => {
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
    if(mode !== 'view') {
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
        this.editor.graph.line.update();
        this.update({ active: line.data });
        this.clearActive();
        this.editor.graph.line.setActiveLine(line);
      });
      this.editor.graph.on('paper:click', () => {
        this.update({ active: undefined });
      });
      this.editor.graph.on('line:beforeadd', ({ data: line }: { data: any }) => {
        const data = this.editor.schema.getData();
        makeLineSort([...data.lines, line]);
        line.type = ISchemaEnum.Edge;
        line.style = LINE_STYLE;
        line.arrowStyle = ARROW_STYLE;
      });
      this.editor.graph.on('node:remove', ({ node }) => {
        const param = { active: undefined } as any;
        if (this.hoveringItem?.data.uuid === node.data.uuid) {
          param.hoveringItem = undefined;
        }
        this.update(param);
      });
      this.editor.graph.on('line:remove', ({ line }) => {
        const data = this.editor.schema.getData();
        makeLineSort(data.lines);
        this.editor.graph.line.update();
        const param = { active: undefined } as any;
        if (this.hoveringItem?.data.uuid === line.data.uuid) {
          param.hoveringItem = undefined;
        }
        this.update(param);
      });
    }
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
        width: NODE_RADIUS * 2,
        height: NODE_RADIUS * 2,
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
      node.type === ISchemaEnum.Edge ? graph.line.lines[node.uuid].data : graph.node.nodes[node.uuid].data;
    Object.assign(originalData, { ...payload });
  };

  duplicateNode = () => {
    const { x, y, name, ...others } = this.active as ISketchNode;
    this.editor.graph.node.addNode({
      ...others,
      x: x + 40,
      y: y + 40,
      name: `${name || ''}(1)`,
      uuid: uuidv4()
    });
  };

  batchApply = async (gql) => {
    const { code, data } = (await service.execNGQL({
      gql,
    })) as any;
    return { code, data };
  };

  deleteElement = (type) => {
    if (type === ISchemaEnum.Tag) {
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
    const { left, top, offsetX, offsetY } = tooltip;
    this.tooltip = { ...this.tooltip, left: left - offsetX, top: top - offsetY };
  };
  destroy = () => {
    this.editor.destroy();
    this.editor = undefined;
    this.active = undefined;
    this.currentSketch = undefined;
  };
}

const sketchStore = new SketchStore();

export default sketchStore;
