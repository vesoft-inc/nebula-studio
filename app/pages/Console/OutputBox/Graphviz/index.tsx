import { GraphvizOptions, graphviz } from 'd3-graphviz';
import React, { useEffect, useRef } from 'react';

import './index.less';

interface IProps {
  graph: string;
}

const Graphviz = (props: IProps) => { 
  const domRef = useRef(null);
  const { graph } = props;
  const renderFlowChart = () => {
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
  };
  useEffect(() => {
    renderFlowChart();
  }, [graph]);
  return <div id="graph" ref={domRef} />;
};

export default Graphviz;
