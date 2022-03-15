import React, { Fragment, useEffect } from 'react';
import './index.less';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import ColorChangeBtn from './ColorChangeBtn';
interface IProps {
  id: string;
}
const Menu = (props: IProps) => {
  const { id } = props;
  const { graphInstances: { graphs } } = useStore();
  const graph = graphs[id];
  const {
    pointer: { left: x, top: y, showContextMenu },
  } = graph;
  const hide = () => {
    graph.setPointer({
      showContextMenu: false,
    });
  };
  useEffect(() => {
    const close = e => {
      const path = e.path || (e.composedPath && e.composedPath());  // safari has no e.path
      const isMenu = path.find(each => each.className === 'context-menu');
      if (isMenu) return;
      hide();
    };
    const container = document.getElementById(id);
    container?.addEventListener('click', close);
    container?.addEventListener('contextmenu', close);
    return () => {
      container?.removeEventListener('click', close);
      container?.removeEventListener('contextmenu', close);
    };
  }, []);
  const menuConfig = [
    {
      component: <ColorChangeBtn graph={graph} onClose={hide} />,
    },
  ];
  const containerWidth = 200;
  const containerHeight = menuConfig.length * 43; // size is fixed in css
  const width = document.getElementById(id)!.clientWidth;
  const height = document.getElementById(id)!.clientHeight;
  const style = { left: 0, top: 0, display: 'block' };
  style.left = width - x - 30 > containerWidth ? x + 30 : x - containerWidth;
  style.top = height - y - 30 > containerHeight ? y + 30 : y - containerHeight;
  if (!showContextMenu) {
    style.display = 'none';
  }

  return (
    <div className="context-menu" style={style}>
      {menuConfig.map((item, index) => (
        <Fragment key={index}>{item.component}</Fragment>
      ))}
    </div>
  );
};
export default observer(Menu);
