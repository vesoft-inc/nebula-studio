import * as d3 from 'd3';
import * as React from 'react';

import './index.less';

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
    nodes: INode[];
    links: ILink[];
  };
}

interface IRefs {
  mountPoint?: HTMLDivElement | null;
}

class NebulaToD3Data extends React.Component<IProps, {}> {
  ctrls: IRefs = {};

  componentDidMount() {
    if (!this.ctrls.mountPoint) {
      return;
    }
    const { width, height, data } = this.props;

    const linkForce = d3
      .forceLink(data.links)
      .id((d: any) => {
        return d.name;
      })
      .distance((d: any) => {
        return d.value * 30;
      });

    const force = d3
      .forceSimulation()
      .nodes(data.nodes)
      .force('charge', d3.forceManyBody().strength(-120))
      .force('link', linkForce)
      .force('center', d3.forceCenter(width / 2, height / 2));

    const svg = d3
      .select(this.ctrls.mountPoint)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    svg
      .append('defs')
      .append('marker')
      .attr('id', 'marker')
      .attr('viewBox', '-0 -5 10 10')
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

    const link = svg
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .style('stroke', '#999999')
      .attr('marker-end', 'url(#marker)')
      .attr('stroke-width', 2);

    function dragStarted(d) {
      if (!d3.event.active) {
        force.alphaTarget(0.3).restart();
      }
      d.fx = d.x;
      d.fy = d.y;

      return d;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragEnded(d) {
      if (!d3.event.active) {
        force.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    }

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const node = svg
      .selectAll('circle')
      .data<INode>(data.nodes)
      .enter()
      .append<SVGCircleElement>('circle')
      .attr('r', 20)
      .attr('class', 'nodes')
      .style('fill', (d: any) => color(d.group))
      .on('click', (d: any) => {
        console.log(d);
      })
      .call(d3
        .drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded) as any);

    const linksText = svg
      .append('g')
      .selectAll('text')
      .data(data.links)
      .enter()
      .append('text')
      .text((d: any) => {
        return d.type;
      });

    const nodeText = svg
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data<INode>(data.nodes)
      .enter()
      .append('text')
      .text((d: INode) => {
        return d.name;
      })
      .on('click', (d: INode) => {
        console.log(d);
      })
      .attr('text-anchor', 'middle')
      .call(d3
        .drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded) as any);

    force.on('tick', () => {
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

  render() {
    return (
      <div
        className="output-graph"
        ref={mountPoint => (this.ctrls.mountPoint = mountPoint)}
      />
    );
  }
}

export default NebulaToD3Data;
