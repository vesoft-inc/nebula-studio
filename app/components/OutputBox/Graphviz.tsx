import { GraphvizOptions, graphviz } from 'd3-graphviz';
import _ from 'lodash';
import * as React from 'react';

import './Graphviz.less';

interface IProps {
  graph: string;
}

export default class Graphviz extends React.Component<IProps> {
  ref: HTMLDivElement;

  componentDidMount() {
    this.renderFlowChart(this.props.graph);
  }

  componentDidUpdate() {
    this.renderFlowChart(this.props.graph);
  }

  renderFlowChart(graph) {
    const defaultOptions: GraphvizOptions = {
      fit: true,
      width: '100%',
      zoom: false,
    };
    graphviz('#graph')
      .options({
        ...defaultOptions,
      })
      .renderDot(graph);
  }

  render() {
    return <div id="graph" ref={(ref: HTMLDivElement) => (this.ref = ref)} />;
  }
}
