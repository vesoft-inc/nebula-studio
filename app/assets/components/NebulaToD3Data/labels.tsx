import * as d3 from 'd3';
import * as React from 'react';

interface INode extends d3.SimulationNodeDatum {
  name: string;
  group: number;
}

class Label extends React.Component<{ node: INode }, {}> {
  ref: SVGTextElement;

  componentDidMount() {
    d3.select(this.ref).data([this.props.node]);
  }

  render() {
    return (
      <text
        className="label"
        ref={(ref: SVGTextElement) => (this.ref = ref)}
        textAnchor="middle"
      >
        {this.props.node.name}
      </text>
    );
  }
}

export default class Labels extends React.Component<{ nodes: INode[] }, {}> {
  render() {
    const labels = this.props.nodes.map((node: INode, index: number) => {
      return <Label key={index} node={node} />;
    });

    return <g className="labels">{labels}</g>;
  }
}
