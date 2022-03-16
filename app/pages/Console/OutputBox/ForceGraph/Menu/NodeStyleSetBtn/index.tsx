import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Popover, Tabs } from 'antd';
import ColorPicker from '@app/components/ColorPicker';

import './index.less';

const TabPane = Tabs.TabPane;

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

  return (
    <div>
      <Tabs onChange={setTagType} defaultActiveKey={tagType} className="tab-type-set">
        <TabPane tab={intl.get('common.color')} key="color">
          <ColorPicker onChangeComplete={onColorChange} />
        </TabPane>
      </Tabs>
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
        <div className="color-group">
          {colorList
            .filter(Boolean)
            .slice(0, 3)
            .map((item) => (
              <span className="circle" key={item} style={{ backgroundColor: item }} />
            ))}
        </div>
        {title && <span className="btn-title">{title}</span>}
      </>
    );
  }

  return (
    <div className="btn-nodeStyle-set">
      <Popover
        overlayClassName="nodeStyle-popover"
        content={
          <SetContent
            onColorChange={handleColorUpdate}
          />
        }
        trigger={'click'}
        visible={visible}
        onVisibleChange={setVisible}
      >
        <div className="color-group">
          {colorList.slice(0, 3).map((item) => (
            <span className="circle" key={item} style={{ backgroundColor: item }} />
          ))}
        </div>
        {title && <span className="btn-title">{title}</span>}
      </Popover>
    </div>
  );
};
export default NodeStyleSetBtn;
