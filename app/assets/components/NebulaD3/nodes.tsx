import * as d3 from 'd3';
import * as React from 'react';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

interface IProps {
  nodes: INode[];
  selectIdsMap: Map<string, boolean>;
  onUpDataNodes: () => void;
}

export default class Nodes extends React.Component<IProps, {}> {
  ref: SVGGElement;

  componentDidMount() {
    this.nodeRender(this.props.nodes);
  }

  componentDidUpdate() {
    this.updateSelectNodes();
  }

  updateSelectNodes = () => {
    const selectIdsMap = this.props.selectIdsMap;
    d3.select(this.ref)
      .selectAll('circle')
      .attr('class', (d: any) => {
        if (selectIdsMap[d.name]) {
          return 'node active';
        }
        return 'node';
      });
  };

  nodeRender(nodes: INode[]) {
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    d3.select(this.ref)
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append<SVGCircleElement>('circle')
      .attr('class', 'node')
      .attr('id', (d: any) => `node-${d.name}`)
      .style('fill', (d: any) => color(d.group));
    if (nodes.length === 0) {
      d3.selectAll('.node').remove();
    } else {
      this.props.onUpDataNodes();
    }
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
