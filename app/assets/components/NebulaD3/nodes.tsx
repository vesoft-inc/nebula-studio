import * as d3 from 'd3';
import * as React from 'react';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

export default class Nodes extends React.Component<{ nodes: INode[] }, {}> {
  ref: SVGGElement;

  componentDidMount() {
    this.nodeRender(this.props.nodes);
  }

  nodeRender(nodes: INode[]) {
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    d3.select(this.ref)
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append<SVGCircleElement>('circle')
      .attr('r', 20)
      .attr('class', 'node')
      .style('stroke', '#FFFFFF')
      .style('stroke-width', 1.5)
      .style('fill', (d: any) => color(d.group));
  }

  render() {
    if (this.ref) {
      this.nodeRender(this.props.nodes);
    }
    return (
      <g ref={(ref: SVGCircleElement) => (this.ref = ref)} className="nodes" />
    );
  }
}
