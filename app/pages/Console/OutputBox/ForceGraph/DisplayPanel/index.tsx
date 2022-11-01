import React, { useState } from 'react';
import cls from 'classnames';
import Icon from '@app/components/Icon';
import { LinkObject, NodeObject } from '@vesoft-inc/force-graph';
import Expand from './ExpandForm';
import styles from './index.module.less';


interface IProps {
  data: {
    nodes: NodeObject[],
    links: LinkObject[]
  }
  spaceVidType: string;
}

const DisplayPanel = (props: IProps) => {
  const [visible, setVisible] = useState(false);
  const { data, spaceVidType } = props;
  return (
    <div className={styles.outputDisplayPanel}>
      <div className={styles.btnTogglePanel} onClick={() => setVisible(!visible)}>
        <Icon
          type="icon-studio-btn-back"
          style={{ transform: `rotate(${visible ? -180 : 0}deg)`, transition: 'all 0.2s' }}
        />
      </div>
      <div className={cls(styles.displayDrawer, { [styles.active]: visible })}>
        <Expand data={data} spaceVidType={spaceVidType} />
      </div>
    </div>
  );
};

export default DisplayPanel;
