import { Fragment } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import styles from './index.module.less';
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
  if(!showContextMenu) {
    return null;
  } 
  const hide = () => {
    graph.setPointer({
      showContextMenu: false,
    });
  };
  
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
  style.left = width - x > containerWidth ? x : x - containerWidth;
  style.top = height - y > containerHeight ? y : y - containerHeight;
  if (!showContextMenu) {
    style.display = 'none';
  }

  return (
    <div className={styles.contextMenu} style={style} onContextMenu={e => e.preventDefault()}>
      {menuConfig.map((item, index) => (
        <Fragment key={index}>{item.component}</Fragment>
      ))}
    </div>
  );
};
export default observer(Menu);
