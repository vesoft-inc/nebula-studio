import { useEffect, useState } from 'react';
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
  const [animationVisible, setAnimationVisible] = useState(false);
  useEffect(() => {
    if(visible) {
      setAnimationVisible(true);
    } else {
      // hack hode tab after animation end, if not hide, tabs will pop up when use tab key to switch focus
      setTimeout(() => setAnimationVisible(false), 500);
    }
  }, [visible]);
  return (
    <div className={styles.outputDisplayPanel}>
      <div className={styles.btnTogglePanel} onClick={() => setVisible(!visible)}>
        <Icon
          type="icon-studio-btn-back"
          style={{ transform: `rotate(${visible ? -180 : 0}deg)`, transition: 'all 0.2s' }}
        />
      </div>
      <div className={cls(styles.displayDrawer, { [styles.active]: visible })}>
        {animationVisible && <Expand data={data} spaceVidType={spaceVidType} />}
      </div>
    </div>
  );
};

export default DisplayPanel;
