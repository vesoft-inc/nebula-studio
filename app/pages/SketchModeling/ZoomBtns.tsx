import Icon from '@app/components/Icon';
import { useStore } from '@app/stores';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './index.module.less';

const ZoomBtns: React.FC = () => {
  const { sketchModel } = useStore();
  const { zoomIn, zoomOut } = sketchModel;

  return (
    <div className={styles.scaleBtns}>
      <Icon className={styles.btn} type="icon-Thumbnail-zoomin" onMouseDown={zoomIn} />
      <Icon className={styles.btn} type="icon-Thumbnail-zoomout" onMouseDown={zoomOut} />
    </div>
  );
};
export default observer(ZoomBtns);
