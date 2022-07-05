import { GraphvizOptions, graphviz } from 'd3-graphviz';
import React, { useEffect, useRef } from 'react';
import cls from 'classnames';
import styles from './index.module.less';

interface IProps {
  graph: string;
  index: number;
}

const Graphviz = (props: IProps) => { 
  const domRef = useRef(null);
  const { graph, index } = props;
  const renderFlowChart = () => {
    const defaultOptions: GraphvizOptions = {
      width: 1100,
      height: 400,
      zoomScaleExtent: [0.1, 200],
      fit: true,
    };
    window.graphviz = graphviz(`.box-${index}`, {
      ...defaultOptions,
    })
      .renderDot(graph);
  };
  useEffect(() => {
    if(graph)
      renderFlowChart();
  }, [graph]);
  return <div className={cls(styles.graphvizBox, `box-${index}`)} ref={domRef} />;
};

export default Graphviz;
