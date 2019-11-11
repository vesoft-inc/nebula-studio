import * as d3 from 'd3';
import * as React from 'react';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

class Node extends React.Component<{ node: INode; color: string }, {}> {
  ref: SVGCircleElement;

  componentDidMount() {
    d3.select(this.ref).data([this.props.node]);
  }

  render() {
    return (
      <circle
        className="node"
        r={20}
        fill={this.props.color}
        ref={(ref: SVGCircleElement) => (this.ref = ref)}
      />
    );
  }
}

export default class Nodes extends React.Component<{ nodes: any }, {}> {
  render() {
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const nodes = this.props.nodes.map((node: INode, index: number) => {
      return (
        <Node key={index} node={node} color={color(node.group.toString())} />
      );
    });

    return <g className="nodes">{nodes}</g>;
  }
}
