import { Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';

import ColorPicker from '#app/components/ColorPicker';
import IconPicker from '#app/components/IconPicker';
interface IIcon {
  type: string;
  content: string;
}

interface IProps {
  handleChangeColorComplete: (color: string) => void;
  handleChangeIconComplete: (icon: IIcon) => void;
}

class StyleSetTabs extends React.PureComponent<IProps> {
  render() {
    const { handleChangeColorComplete, handleChangeIconComplete } = this.props;
    return (
      <Tabs className="tab-type-set">
        <Tabs.TabPane tab={intl.get('common.color')} key="color">
          <ColorPicker handleChangeColorComplete={handleChangeColorComplete} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get('common.icon')} key="icon">
          <IconPicker handleChangeIconComplete={handleChangeIconComplete} />
        </Tabs.TabPane>
      </Tabs>
    );
  }
}

export default StyleSetTabs;
