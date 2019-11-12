import * as d3 from 'd3';
import * as React from 'react';

import './index.less';
import Links from './links';
import Nodes from './nodes';
import Labels from './nodeText';
import Rect from './rect';

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
        <Rect nodes={data.vertexs} />
      </svg>
    );
  }
}

export default NebulaToD3Data;
