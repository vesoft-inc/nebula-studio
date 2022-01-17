import * as d3 from 'd3';
import _ from 'lodash';
import * as React from 'react';

import { INode } from '#app/utils/interface';

interface IProps {
  nodes: INode[];
  onUpDataNodeTexts: () => void;
}

export default class NodeTexts extends React.Component<IProps, {}> {
  ref: SVGGElement;

  componentDidMount() {
    this.labelRender(this.props.nodes);
  }

  componentDidUpdate(prevProps) {
    const { nodes } = this.props;
    if (nodes.length < prevProps.nodes.length) {
      const removeNodes = _.differenceBy(
        prevProps.nodes,
        nodes,
        (v: any) => v.name,
      );
      removeNodes.forEach(removeNode => {
        d3.select('#name_' + removeNode.uuid).remove();
      });
    } else {
      this.labelRender(this.props.nodes);
    }
  }

  labelRender(nodes) {
    d3.select(this.ref)
      .selectAll('.label')
      .data<INode>(nodes)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('id', d => 'name_' + d.uuid)
      .attr('text-anchor', 'middle');

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
