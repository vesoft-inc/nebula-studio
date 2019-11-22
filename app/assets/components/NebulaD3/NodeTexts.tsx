import * as d3 from 'd3';
import * as React from 'react';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}
interface IProps {
  nodes: INode[];
  onUpDataNodeTexts: () => void;
}

export default class NodeTexts extends React.Component<IProps, {}> {
  ref: SVGGElement;

  componentDidMount() {
    this.labelRender(this.props.nodes);
  }

  componentDidUpdate() {
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
      .text((d: INode) => d.name);

    d3.select(this.ref)
      .selectAll('text')
      .data<INode>(nodes)
      .exit()
      .remove();

    if (this.ref) {
      this.props.onUpDataNodeTexts();
    }
  }
  render() {
    return (
      <g className="labels" ref={(ref: SVGGElement) => (this.ref = ref)} />
    );
  }
}
