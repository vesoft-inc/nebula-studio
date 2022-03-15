import { GraphStore } from '@app/stores/graph';
import graphInstancesStore from '@app/stores/graphInstances';
import { NodeObject } from '@app/components/ForceGraph';
import { trackEvent } from '@app/utils/stat';
const brushCss = {
  position: 'absolute',
  'z-index': 300000,
  border: 'dotted 1px #3e74cc',
  'background-color': 'rgba(255, 255, 255, 0.5)',
  'pointer-events': 'none',
};

const brushCssText = Object.keys(brushCss)
  .reduce((ret, key) => (ret.push(`${key}:${brushCss[key]};`), ret), [] as string[])
  .join('');

interface BrushSelectProps {
  graphStore: GraphStore;
  container: HTMLElement;
}

export default class BrushSelect {
  graphStore: BrushSelectProps['graphStore'];
  container: BrushSelectProps['container'];

  selectDom?: HTMLDivElement;
  selectStart?: { x: number; y: number };

  isMoving = false;
  isRightSelecting = false;

  constructor({ graphStore, container }: BrushSelectProps) {
    this.graphStore = graphStore;
    this.container = container;
    this.#addEventListener();
  }

  #initSelectDom(e: PointerEvent) {
    this.selectDom = document.createElement('div');
    // this.selectDom.classList.add(styles.graphBoxSelect);
    this.selectDom.style.cssText = brushCssText;
    this.selectDom.style.left = e.offsetX.toString() + 'px';
    this.selectDom.style.top = e.offsetY.toString() + 'px';
    this.container.appendChild(this.selectDom);
  }

  #removeSelectDom() {
    this.selectDom?.remove();
    this.selectDom = undefined;
  }

  #addEventListener() {
    (['pointerdown', 'pointermove', 'pointerup', 'pointerout'] as const).forEach((eventName) => {
      this.container.addEventListener(eventName, this[eventName]);
    });
  }

  pointerdown = (e: PointerEvent) => {
    if (!e.shiftKey && e.button !== 2) {
      return;
    }
    if (e.button === 2) {
      this.isRightSelecting = true;
    }

    e.preventDefault();
    this.#initSelectDom(e);
    this.selectStart = {
      x: e.offsetX,
      y: e.offsetY,
    };
  };

  pointermove = (e: PointerEvent) => {
    if ((!e.shiftKey && !this.isRightSelecting) || !this.selectDom) {
      return;
    }

    e.preventDefault();
    this.isMoving = true;
    if (e.offsetX < this.selectStart!.x) {
      this.selectDom.style.left = e.offsetX.toString() + 'px';
      this.selectDom.style.width = (this.selectStart!.x - e.offsetX).toString() + 'px';
    } else {
      this.selectDom.style.left = this.selectStart!.x.toString() + 'px';
      this.selectDom.style.width = (e.offsetX - this.selectStart!.x).toString() + 'px';
    }
    if (e.offsetY < this.selectStart!.y) {
      this.selectDom.style.top = e.offsetY.toString() + 'px';
      this.selectDom.style.height = (this.selectStart!.y - e.offsetY).toString() + 'px';
    } else {
      this.selectDom.style.top = this.selectStart!.y.toString() + 'px';
      this.selectDom.style.height = (e.offsetY - this.selectStart!.y).toString() + 'px';
    }
  };

  pointerup = (e: PointerEvent) => {
    this.isRightSelecting = false;
    if (!this.selectDom || !this.isMoving) {
      this.#removeSelectDom();
      return;
    }

    e.preventDefault();

    const { top, left, width, height } = this.selectDom.style;
    const rect = {
      left: parseInt(left),
      top: parseInt(top),
      right: parseInt(left) + parseInt(width),
      bottom: parseInt(top) + parseInt(height),
    };

    if (e.shiftKey) {
      if (e.offsetX < this.selectStart!.x) {
        rect.left = e.offsetX;
        rect.right = this.selectStart!.x;
      } else {
        rect.left = this.selectStart!.x;
        rect.right = e.offsetX;
      }

      if (e.offsetY < this.selectStart!.y) {
        rect.top = e.offsetY;
        rect.bottom = this.selectStart!.y;
      } else {
        rect.top = this.selectStart!.y;
        rect.bottom = e.offsetY;
      }
    }

    this.isMoving = false;
    this.#removeSelectDom();
    const { nodes, links } = this.runBoxSelect(rect);
    this.graphStore.selectNodes(nodes);
    this.graphStore.selectLinks(links);
    trackEvent('canvas', 'brushSelect');
  };

  pointerout = (e: PointerEvent) => {
    if (this.selectDom) {
      e.preventDefault();
      this.#removeSelectDom();
    }
  };

  runBoxSelect = ({ left, bottom, top, right }: Record<string, number>) => {
    const { twoGraph } = this.graphStore;
    const tl = twoGraph!.instance.screen2GraphCoords(left, top);
    const br = twoGraph!.instance.screen2GraphCoords(right, bottom);
    const { nodes, links } = twoGraph!.instance.graphData();
    return {
      nodes: nodes.filter((node) => tl.x < node.x! && node.x! < br.x && br.y > node.y! && node.y! > tl.y),
      links: links.filter((link) => {
        const source = link.source as NodeObject;
        const target = link.target as NodeObject;
        const topLeft = { x: Math.min(source.x!, target.x!), y: Math.min(source.y!, target.y!) };
        const bottomRight = { x: Math.max(source.x!, target.x!), y: Math.max(source.y!, target.y!) };
        return tl.x < topLeft.x && tl.y < topLeft.y && br.x > bottomRight.x && br.y > bottomRight.y;
      }),
    };
  };

  distroy() {
    (['pointerdown', 'pointermove', 'pointerup', 'pointerout'] as const).forEach((eventName) => {
      this.container.removeEventListener(eventName, this[eventName]);
    });
  }
}

export const initBrushSelect = ({ container, id }) => new BrushSelect({ container, graphStore: graphInstancesStore.graphs[id] });

  
