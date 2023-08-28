import { autorun, makeObservable, observable, reaction, IReactionDisposer } from 'mobx';
import { FONT_SIZE, LINE_LENGTH, NODE_AREA, NODE_SIZE } from '@app/config/explore';
import ForceGraph, { ForceGraphInstance, LinkObject, NodeObject } from '@vesoft-inc/force-graph';
import { forceX, forceY } from 'd3-force-3d';
import { Bezier } from 'bezier-js';
import { GraphStore } from './graph';
import { ITransform } from './types';
/**
 * 2dview store
 *
 * @class
 */
class TwoGraph {
  graph: GraphStore;
  container: HTMLElement;
  canvas: HTMLCanvasElement | null;
  // running status to make renderer render
  running = false;
  progressValue = 0;
  transform: ITransform = { k: 1, x: 0, y: 0 };
  instance: ForceGraphInstance;
  autorunDisposer: IReactionDisposer;
  reactionDisposer: IReactionDisposer;

  constructor(graph: GraphStore, container: HTMLElement) {
    this.graph = graph;
    this.container = container;
    makeObservable(this, {
      transform: observable,
      instance: false,
      graph: false,
      autorunDisposer: false,
    });
    this.init();
  }

  setTransform = (transform: Partial<ITransform>) =>
    Object.keys(transform).forEach((key) => (this.transform[key] = transform[key]));

  renderNode = (node, ctx: CanvasRenderingContext2D) => {
    const { graph } = this;
    const color = graph.filterExclusionIds[node.id] ? '#efefef' : node.color;
    const nodeSize = node.nodeArea ? Math.sqrt(node.nodeArea) : NODE_SIZE;
    ctx.fillStyle = color;
    ctx.strokeStyle = undefined;
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI, false);
    ctx.fill();
    if (graph.nodesSelected.has(node) || graph.nodeHovering === node) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = !graph.nodesSelected.has(node) ? '#fbe969' : 'rgba(0, 0, 0, 0.5)';
      ctx.shadowColor = !graph.nodesSelected.has(node) ? '#1890ff' : 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.shadowColor = null;
    }

    this.renderNodeLabel(node, ctx, nodeSize);
  };

  renderNodeLabel = (node, ctx: CanvasRenderingContext2D, nodeSize) => {
    // renderlabel
    const label = node.id;
    if (label && this.transform.k > 0.9) {
      ctx.strokeStyle = null;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${FONT_SIZE}px Sans-Serif`;
      ctx.fillText(label, node.x, node.y + nodeSize + FONT_SIZE);
    }
  };

  // init ForceGraph instance ,it will be called only once
  init = () => {
    const { graph } = this;
    const Graph = ForceGraph()(this.container);
    this.canvas = this.container.querySelector('canvas');
    Graph.d3Force('link')!
      .distance((d) => {
        return d.lineLength || LINE_LENGTH;
      })
      .strength(0.05);
    Graph.d3Force('x', forceX().strength(0.0085));
    Graph.d3Force('y', forceY().strength(0.0085));
    Graph.d3Force('charge')!.strength(-100);
    Graph.width(1100).height(400);
    Graph.onZoom((v) => {
      this.setTransform(v);
      graph.setPointer({
        showContextMenu: false,
      });
      Graph.linkVisibility(() => false);
    })
      .d3AlphaDecay(0.01)
      .onZoomEnd(() => Graph.linkVisibility(() => true))
      .minZoom(0.1)
      .nodeVal((node) => {
        // circle area
        return <number>(node.nodeArea || NODE_AREA);
      })
      .nodeRelSize(1)
      .linkDirectionalArrowLength(() => {
        return this.transform.k > 1 ? 6 : 0;
      })
      .linkDirectionalArrowRelPos(1)
      .cooldownTicks(90)
      .onEngineStop(() => {
        // fix every node's pos
        graph.nodes.forEach((item) => {
          item.fx = item.x;
          item.fy = item.y;
        });
      })
      .linkColor((link) => {
        const { source, target } = link as any;
        if (graph.filterExclusionIds[source.id] || graph.filterExclusionIds[target.id]) {
          return '#efefef';
        }
        return graph.linksSelected.has(link) ? '#0091ff' : graph.linkHovering === link ? '#fbe969' : '#999999';
      })
      .onLinkClick((link, event) => {
        const hasSelected = graph.linksSelected.has(link);
        if (event.ctrlKey || event.shiftKey || event.altKey) {
          hasSelected ? graph.unselectLinks([link]) : graph.selectLinks([link]);
          return;
        }
        graph.unselectLinks();
        graph.selectLinks([link]);
      })
      .onLinkHover((link) => {
        graph.setHoveingdLink(link);
      })
      .onNodeHover((node) => {
        graph.setHoveringNode(node);
      })
      // .autoPauseRedraw(false)
      .nodeCanvasObjectMode(() => 'replace')
      .nodeCanvasObject((node: any, ctx) => {
        this.renderNode(node, ctx);
      })
      .onNodeClick((node, event) => {
        graph.setPointer({
          showContextMenu: false,
        });
        const hasSelected = graph.nodesSelected.has(node);
        // multi-selection
        if (event.ctrlKey || event.shiftKey || event.altKey) {
          hasSelected ? graph.unselectNodes([node]) : graph.selectNodes([node]);
          return;
        }
        // single-selection
        graph.replaceNodeSelected([node]);
      })
      .onNodeRightClick((node, event) => {
        graph.selectNodes([node]);
        graph.setPointer({
          left: event.offsetX,
          top: event.offsetY,
          event,
          showContextMenu: true,
        });
      })
      .onBackgroundClick(() => {
        graph.unselectNodes();
        graph.unselectLinks();
        graph.setHoveringNode(null);
        graph.setPointer({
          showContextMenu: false,
        });
      })
      .onNodeDrag((node, translate) => {
        graph.setDraggingNode(node);
        if (!graph.nodesSelected.has(node)) {
          return;
        }
        graph.nodesSelected
          .toJSON()
          .filter((selNode) => selNode !== node) // don't touch node being dragged
          .forEach((node) =>
            ['x', 'y'].forEach((coord) => {
              node[`f${coord}`] = node[coord] + translate[coord];
            }),
          );
      })
      .onNodeDragEnd(() => {
        graph.setDraggingNode(null);
        graph.nodes.forEach((item) => {
          item.fx = item.x;
          item.fy = item.y;
        });
      })
      .linkCurvature((link) => {
        // cuclate link's curvature by graphIndex
        let curvature = 0;
        if (link.source === link.target) {
          curvature = link.graphIndex as number;
        } else {
          const { graphIndex = 0 } = <any>link;
          // the seem direction links will be the seem side
          if (graphIndex !== 0) {
            const direction = graphIndex % 2 === 0; // link's rank direction
            // (graphIndex / Math.abs(graphIndex)) means different source's direction
            curvature = (direction ? 1 : -1) * (graphIndex > 0 ? 1 : -1) * (Math.ceil(Math.abs(graphIndex) / 2) * 0.1);
          }
        }
        link.curvature = curvature;
        return curvature;
      })
      .linkCanvasObjectMode(() => 'after')
      .linkCanvasObject((link: LinkObject, ctx, _scale) => {
        const start = link.source as NodeObject;
        const end = link.target as NodeObject;
        if (typeof start !== 'object' || typeof end !== 'object') return;
        // init text position
        const textPos: { x: number; y: number } = {
          x: (start.x! + end.x!) * 0.5,
          y: (start.y! + end.y!) * 0.5,
        };
        // init link vector2
        const relLink = {
          x: end.x! - start.x!,
          y: end.y! - start.y!,
        };
        // get bezier controlPoints from ForceGraph
        const controlPoints = link.__controlPoints as [number, number, number, number];
        if (link.curvature !== 0 && controlPoints) {
          // sometimes controlpoints not exist
          if (link.source === link.target) {
            relLink.x = controlPoints[2] - controlPoints[0];
            relLink.y = controlPoints[3] - controlPoints[1];
          }
          const bzLine = new Bezier(start.x, start.y, ...controlPoints, end.x, end.y);
          // get text pos if there ara bezier2 or bezier3 line
          if (bzLine) {
            const pos = bzLine.get(0.5);
            textPos.x = pos.x;
            textPos.y = pos.y;
          }
        }
        // caculate textAngle by vector
        let textAngle = Math.atan2(relLink.y, relLink.x);
        // make sure the angle in Web Axis
        if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
        if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

        const labels = (<string>link.label).split('\r\n');
        const zoom = this.transform.k;
        if (!labels.length || zoom < 1 || graph.loading) return;
        let maxLabel = '';
        labels.forEach((each) => each.length > maxLabel.length && (maxLabel = each));

        ctx.font = `${FONT_SIZE}px Sans-Serif`;
        const totalHeight = labels.length * (FONT_SIZE + 2) - 2;
        const offsetY = totalHeight / 2;
        const textRect = ctx.measureText(maxLabel);
        ctx.save();
        ctx.translate(textPos.x, textPos.y);
        if (this.transform.k > 2) {
          ctx.scale(2 / this.transform.k, 2 / this.transform.k);
        }
        ctx.rotate(textAngle);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        labels.forEach((each, index) => {
          // calcute label's position by textRect
          ctx.fillStyle = '#F3F6F9';
          const labelY = -offsetY + FONT_SIZE / 2 + index * (FONT_SIZE + 2);
          ctx.fillRect(-textRect.width / 2, labelY - FONT_SIZE / 2, textRect.width, FONT_SIZE);
          ctx.fillStyle = 'darkgrey';
          ctx.fillText(each, 0, labelY);
        });
        ctx.restore();
      })
      .zoom(1.01)
      .graphData({
        nodes: [...graph.nodes],
        links: [...graph.links],
      });
    Graph.enableZoomInteraction(false);

    this.instance = Graph;
    // rerender when data change
    this.autorunDisposer = autorun(() => {
      graph.makeLineSort();
      // reset node's v
      graph.nodes.forEach((node) => {
        node.vx = 0;
        node.vy = 0;
      });
      // disable hover when redraw isnot coming
      Graph.graphData({ nodes: [...graph.nodes], links: [...graph.links] });
    });

    // rerender
    this.reactionDisposer = reaction(
      () => [
        graph.nodeHovering,
        graph.linksSelected.toJSON(),
        graph.showEdgeFields,
        graph.showTagFields,
        graph.tagColorMap,
        graph.filterExclusionIds,
        graph.linkHovering,
        graph.nodesSelected.toJSON(),
      ],
      () => {
        Graph.nodeColor(Graph.nodeColor());
      },
    );
  };

  zoom = (type: 'out' | 'in') => {
    const scale = this.instance.zoom();
    let newScale;
    if (type === 'out') {
      newScale = scale - 0.01;
    } else if (type === 'in') {
      newScale = scale + 0.01;
    }
    this.instance.zoom(newScale);
  };

  /**
   * save stauts
   *
   * @returns
   */
  getData = () => {
    return {
      transform: this.transform,
    };
  };

  setData = (data) => {
    const { transform } = data;
    if (!transform) return;
    const { k, x, y } = transform;
    this.instance.zoom(k, 0);
    this.instance.centerAt(x, y, 0);
  };

  /**
   * soft destroy
   */
  destroy() {
    this.autorunDisposer();
    this.reactionDisposer();
    this.instance._destructor();
    this.canvas?.remove();
  }
}
export default TwoGraph;
