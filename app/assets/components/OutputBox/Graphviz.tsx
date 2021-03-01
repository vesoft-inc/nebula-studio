import { graphviz, GraphvizOptions } from 'd3-graphviz';
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
    const { clientWidth, clientHeight } = this.ref;
    const scale = 0.5;
    const defaultOptions: GraphvizOptions = {
      fit: true,
      height: 'auto',
      width: '100%',
      zoom: false,
      viewBox: `0 0 ${clientWidth * scale}  ${clientHeight * scale}`,
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
