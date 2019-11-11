import * as d3 from 'd3';
import * as React from 'react';

import './index.less';
import Labels from './labels';
import Links from './links';
import Nodes from './nodes';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

interface ILink extends d3.SimulationLinkDatum<INode> {
  value: number;
}

interface IProps {
  width: number;
  height: number;
  data: {
    vertexs: INode[];
    edges: ILink[];
  };
  onSelectVertex: (vertex: any[]) => void;
}

interface IRefs {
  mountPoint?: SVGSVGElement | null;
}

class NebulaToD3Data extends React.Component<IProps, {}> {
  ctrls: IRefs = {};
  force: any;

  componentDidMount() {
    if (!this.ctrls.mountPoint) {
      return;
    }
    const { width, height, data } = this.props;

    const linkForce = d3
      .forceLink(data.edges)
      .id((d: any) => {
        return d.name;
      })
      .distance((d: any) => {
        return d.value * 30;
      });

    const svg = d3
      .select(this.ctrls.mountPoint)
      .attr('width', width)
      .attr('height', height);

    svg
      .append('defs')
      .append('marker')
      .attr('id', 'marker')
      .attr('viewBox', '1 -5 10 10')
      .attr('refX', 30)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('path')
      .attr('d', 'M 0,-5 L 12 ,0 L 0,5')
      .attr('fill', '#999')
      .attr('stroke', '#999');

    this.force = d3
      .forceSimulation()
      .nodes(data.vertexs)
      .force('charge', d3.forceManyBody().strength(-120))
      .force('link', linkForce)
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = d3.selectAll('.link').attr('marker-end', 'url(#marker)');
    const linksText = d3.selectAll('.text');
    const node = d3
      .selectAll('.node')
      .on('click', (d: any) => {
        this.props.onSelectVertex([d.name]);
      })
      .call(d3
        .drag()
        .on('start', d => this.dragstart(d))
        .on('drag', d => this.dragged(d))
        .on('end', d => this.dragEnded(d)) as any);
    const nodeText = d3
      .selectAll('.label')
      .on('click', (d: any) => {
        this.props.onSelectVertex([d.name]);
      })
      .call(d3
        .drag()
        .on('start', d => this.dragstart(d))
        .on('drag', d => this.dragged(d))
        .on('end', d => this.dragEnded(d)) as any);

    this.force.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      nodeText
        .attr('x', (d: any) => {
          return d.x;
        })
        .attr('y', (d: any) => {
          return d.y + 5;
        });

      linksText
        .attr('x', (d: any) => {
          return (d.source.x + d.target.x) / 2;
        })
        .attr('y', (d: any) => {
          return (d.source.y + d.target.y) / 2;
        });
    });

    if (data.vertexs.length !== 0) {
      const startPoint = {
        x: 0,
        y: 0,
      };
      const rect = svg
        .append('rect')
        .style('stroke', 'gray')
        .style('stroke-width', '0.6')
        .style('fill', 'transparent')
        .style('stroke-opacity', '0.6');
      d3.selectAll('svg')
        .on('mousedown', () => {
          startPoint.x = d3.event.offsetX;
          startPoint.y = d3.event.offsetY;
        })
        .on('mousemove', () => {
          if (startPoint.x !== 0) {
            rect
              .attr('x', Math.min(d3.event.offsetX, startPoint.x))
              .attr('y', Math.min(d3.event.offsetY, startPoint.y))
              .attr('width', Math.abs(d3.event.offsetX - startPoint.x))
              .attr('height', Math.abs(d3.event.offsetY - startPoint.y));
          }
        })
        .on('mouseup', () => {
          const nodes = data.vertexs;
          const len = nodes.length;
          for (let _i: number = 0; _i < len; _i++) {
            const nodePoint: any = nodes[_i];
            if (this.isNotSelected(nodePoint, startPoint)) {
              continue;
            }
            console.log(nodePoint);
          }
          startPoint.x = 0;
          startPoint.y = 0;
          rect.attr('width', 0).attr('height', 0);
        });
    }
  }

  isNotSelected(nodePoint, startPoint) {
    if (
      (nodePoint.x > startPoint.x && nodePoint.x > d3.event.offsetX) ||
      (nodePoint.x < startPoint.x && nodePoint.x < d3.event.offsetX) ||
      (nodePoint.y > startPoint.y && nodePoint.y > d3.event.offsetY) ||
      (nodePoint.y < startPoint.y && nodePoint.y < d3.event.offsetY)
    ) {
      return true;
    }
    return false;
  }

  dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  dragstart = (d: any) => {
    if (!d3.event.active) {
      this.force.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;

    return d;
  };

  dragEnded(d) {
    if (!d3.event.active) {
      this.force.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  }

  render() {
    const { data } = this.props;
    return (
      <svg
        className="output-graph"
        ref={mountPoint => (this.ctrls.mountPoint = mountPoint)}
      >
        <Links links={data.edges} />
        <Nodes nodes={data.vertexs} />
        <Labels nodes={data.vertexs} />
      </svg>
    );
  }
}

export default NebulaToD3Data;
