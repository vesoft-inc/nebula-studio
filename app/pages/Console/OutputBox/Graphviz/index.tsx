import { GraphvizOptions, graphviz } from 'd3-graphviz';
import React, { useEffect, useRef } from 'react';

import './index.less';

interface IProps {
  graph: string;
  index: number;
}

const Graphviz = (props: IProps) => { 
  const domRef = useRef(null);
  const { graph, index } = props;
  const renderFlowChart = () => {
    const defaultOptions: GraphvizOptions = {
      width: '100%',
      zoom: true,
    };
    graphviz(`.box-${index}`)
      .options({
        ...defaultOptions,
      })
      .renderDot(graph);
  };
  useEffect(() => {
    renderFlowChart();
  }, [graph]);
  return <div className={`graphviz-box box-${index}`} ref={domRef} />;
};

export default Graphviz;
