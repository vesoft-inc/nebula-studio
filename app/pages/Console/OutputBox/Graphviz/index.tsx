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
  return <div className={cls(styles.graphvizBox, `box-${index}`)} ref={domRef} />;
};

export default Graphviz;
