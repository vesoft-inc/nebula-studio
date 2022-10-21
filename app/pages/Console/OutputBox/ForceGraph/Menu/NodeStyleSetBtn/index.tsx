import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Popover, Tabs } from 'antd';
import ColorPicker from '@app/components/ColorPicker';

import styles from './index.module.less';

interface IProps {
  onColorChange?: (color) => void;
  title?: string;
  colorList: any;
  disabled?: boolean;
}

interface ISetProps {
  onColorChange: (color: string) => void;
}

const SetContent: React.FC<ISetProps> = (props: ISetProps) => {
  const { onColorChange } = props;
  const [tagType, setTagType] = useState('color');
  const items = [
    {
      key: 'color',
      label: intl.get('common.color'),
      children: <ColorPicker onChangeComplete={onColorChange} />
    }
  ];
  return (
    <div>
      <Tabs onChange={setTagType} defaultActiveKey={tagType} className={styles.tabTypeSet} items={items} />
    </div>
  );
};

const NodeStyleSetBtn: React.FC<IProps> = (props: IProps) => {
  const { title, colorList, onColorChange, disabled } = props;
  const [visible, setVisible] = useState(false);
  const handleColorUpdate = (color) => {
    setVisible(false);
    if (onColorChange) {
      onColorChange(color.hex);
    }
  };

  if (disabled === true) {
    return (
      <>
        <div className={styles.colorGroup}>
          {colorList
            .filter(Boolean)
            .slice(0, 3)
            .map((item) => (
              <span className={styles.circle} key={item} style={{ backgroundColor: item }} />
            ))}
        </div>
        {title && <span className={styles.btnTitle}>{title}</span>}
      </>
    );
  }

  return (
    <div className={styles.btnNodeStyleSet}>
      <Popover
        overlayClassName={styles.nodeStylePopover}
        content={
          <SetContent
            onColorChange={handleColorUpdate}
          />
        }
        trigger={'click'}
        open={visible}
        onOpenChange={setVisible}
      >
        <div className={styles.colorGroup}>
          {colorList.slice(0, 3).map((item) => (
            <span className={styles.circle} key={item} style={{ backgroundColor: item }} />
          ))}
        </div>
        {title && <span className={styles.btnTitle}>{title}</span>}
      </Popover>
    </div>
  );
};
export default NodeStyleSetBtn;
