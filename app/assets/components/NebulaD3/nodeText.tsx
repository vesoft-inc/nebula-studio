import * as d3 from 'd3';
import * as React from 'react';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

export default class NodeText extends React.Component<
  { nodes: INode[]; onUpDataNodeTexts: () => void },
  {}
> {
  ref: SVGGElement;

  componentDidMount() {
    this.labelRender(this.props.nodes);
  }

  labelRender(nodes) {
    d3.select(this.ref)
      .selectAll('text')
      .data<INode>(nodes)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .text((d: INode) => {
        return d.name;
      });
    this.props.onUpDataNodeTexts();
  }
  render() {
    if (this.ref) {
      this.labelRender(this.props.nodes);
    }

    return (
      <g className="labels" ref={(ref: SVGGElement) => (this.ref = ref)} />
    );
  }
}
