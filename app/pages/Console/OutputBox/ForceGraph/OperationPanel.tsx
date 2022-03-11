import React, { useRef } from 'react';
import { GraphStore } from '@app/stores/graph';
import Icon from '@app/components/Icon';

import './index.less';

interface IProps {
  graph: GraphStore
}
const OperationPanel = (props: IProps) => {
  const { graph } = props;
  const timer = useRef<number>();
  
  const handleZoom = (type) => {
    timer.current = requestAnimationFrame(() => {
      graph.twoGraph!.zoom(type);
      handleZoom(type);
    });
  };

  const endZoom = () => {
    cancelAnimationFrame(timer.current!);
    timer.current = undefined;
  };

  return (
    <div className="canvas-operations">
      <Icon onMouseDown={() => handleZoom('in')} onMouseUp={endZoom} type="icon-studio-console-zoomin" />
      <Icon onMouseDown={() => handleZoom('out')} onMouseUp={endZoom} type="icon-studio-console-zoomout" />
    </div>
  );
};

export default OperationPanel;
