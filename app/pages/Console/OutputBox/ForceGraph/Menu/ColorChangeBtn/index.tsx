import React from 'react';
import intl from 'react-intl-universal';
import { observer } from 'mobx-react-lite';
import MenuButton from '@app/components/Button';
import { uniq } from 'lodash';
import { GraphStore } from '@app/stores/graph';
import NodeStyleSetBtn from '../NodeStyleSetBtn';

interface IProps {
  graph: GraphStore;
  onClose?: () => void;
}

const DEFAULT_CONFIG = ['#ece9e8'];
const ColorChangeBtn: React.FC<IProps> = (props: IProps) => {
  const { onClose, graph } = props;
  const { nodesSelected } = graph;

  const handleUpdateVertex = (value, nodesSelected, type) => {
    nodesSelected.forEach(vertex => {
      vertex[type] = value;
    });
    graph.replaceNodeSelected([...nodesSelected]);
    graph.initData({ nodes: [...graph.nodes], links: [...graph.links] });
  };

  const handleColorUpdate = (color: string) => {
    handleUpdateVertex(color, nodesSelected, 'color');
    if (onClose) {
      onClose();
    }
  };

  let colorList;
  if (nodesSelected.size === 0) {
    colorList = DEFAULT_CONFIG;
  } else {
    colorList = uniq([...nodesSelected].map(item => item.color));
  }
  return (
    <MenuButton
      component={
        <NodeStyleSetBtn
          disabled={nodesSelected.size === 0}
          onColorChange={handleColorUpdate}
          colorList={colorList}
          title={intl.get('explore.vertexStyle')}
        />
      }
      trackCategory="explore"
      trackAction="change_color"
      trackLabel="from_panel"
      disabled={nodesSelected.size === 0}
    />
  );
};

export default observer(ColorChangeBtn);
