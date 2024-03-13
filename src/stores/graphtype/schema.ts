import initShapes, { initShadowFilter } from '@/components/Shapes/Shapers';
// import { ARROW_STYLE, LINE_STYLE, makeLineSort } from "@/components/Shapes/config";
import { VisualEditorLine, VisualEditorNode } from '@/interfaces';
import { RootStore } from '@/stores/index';
// import { VisualEditorType } from "@/utils/constant";
import VEditor, { VEditorOptions } from '@vesoft-inc/veditor';
import { makeObservable, observable } from 'mobx';

type VisualEditorItem = VisualEditorNode | VisualEditorLine;

class SchemaStore {
  rootStore?: RootStore;
  zoomFrame?: number;
  editor?: VEditor;
  container?: HTMLDivElement;
  hoveringItem?: VisualEditorItem;
  activeItem?: VisualEditorItem;

  constructor(rootStore?: RootStore) {
    this.rootStore = rootStore;
    makeObservable(this, {
      editor: observable.ref,
      container: observable.ref,
      hoveringItem: observable.ref,
      zoomFrame: false,
    });
  }

  initEditor(params: { container: HTMLDivElement; schema?: string; options?: VEditorOptions }) {
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
    // this.initEvents(options?.mode);
  }

  update = (
    payload: Partial<{
      hoveringItem: VisualEditorItem;
      activeItem: VisualEditorItem;
    }>
  ) => {
    const { hoveringItem, activeItem } = payload;
    if (hoveringItem) {
      this.hoveringItem = hoveringItem;
    }
    if (activeItem) {
      this.activeItem = activeItem;
    }
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

  // initEvents = (mode: VEditorOptions['mode']) => {
  //   if (!this.editor) return;
  //   this.editor.graph.on('node:mouseenter', ({ node }) => {
  //     this.update({ hoveringItem: node });
  //   });
  //   this.editor.graph.on('line:mouseenter', ({ line }) => {
  //     this.update({ hoveringItem: line });
  //   });
  //   this.editor.graph.on('node:mouseleave', () => {
  //     this.update({ hoveringItem: undefined });
  //   });
  //   this.editor.graph.on('line:mouseleave', () => {
  //     this.update({ hoveringItem: undefined });
  //   });
  //   if (mode !== 'view') {
  //     this.editor.graph.on('node:click', ({ node }) => {
  //       this.update({ activeItem: node.data });
  //     });
  //     this.editor.graph.on('node:change', ({ node }) => {
  //       if (!this.editor) return;
  //       this.update({ activeItem: node.data });
  //       this.clearActive();
  //       this.editor.graph.node.setActive(node);
  //     });
  //     this.editor.graph.on('line:click', ({ line }) => {
  //       this.update({ activeItem: line.data });
  //     });
  //     this.editor.graph.on('line:add', ({ line }) => {
  //       if (!this.editor) return;
  //       this.editor.graph.line.update();
  //       this.update({ activeItem: line.data });
  //       this.clearActive();
  //       this.editor.graph.line.setActiveLine(line);
  //     });
  //     this.editor.graph.on('paper:click', () => {
  //       this.update({ activeItem: undefined });
  //     });
  //     this.editor.graph.on('line:beforeadd', ({ data: line }: { data: any }) => {
  //       if (!this.editor) return;
  //       const data = this.editor.schema.getData();
  //       makeLineSort([...data.lines, line]);
  //       line.type = VisualEditorType.Edge;
  //       line.style = LINE_STYLE;
  //       line.arrowStyle = ARROW_STYLE;
  //     });
  //     this.editor.graph.on('node:remove', ({ node }) => {
  //       const param = { active: undefined } as any;
  //       if (this.hoveringItem?.data.uuid === node.data.uuid) {
  //         param.hoveringItem = undefined;
  //       }
  //       this.update(param);
  //       // this.validateSameNameData();
  //     });
  //     this.editor.graph.on('line:remove', ({ line }) => {
  //       if (!this.editor) return;
  //       const data = this.editor.schema.getData();
  //       makeLineSort(data.lines);
  //       this.editor.graph.line.update();
  //       const param = { active: undefined } as any;
  //       if (this.hoveringItem?.data.uuid === line.data.uuid) {
  //         param.hoveringItem = undefined;
  //       }
  //       this.update(param);
  //       // this.validateSameNameData();
  //     });
  //   }
  // };

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
