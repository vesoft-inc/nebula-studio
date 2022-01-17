import { Popover } from 'antd';
import _ from 'lodash';
import React from 'react';

import DisplayBtn from './DisplayBtn';
import StyleSetTabs from './StyleSetTabs';
interface IIcon {
  type: string;
  content: string;
}

interface IProps {
  icon?: string;
  color: string;
  handleChangeColorComplete: (color: string) => void;
  handleChangeIconComplete: (icon: IIcon) => void;
}

class VertexStyleSet extends React.PureComponent<IProps> {
  render() {
    const {
      icon,
      color,
      handleChangeColorComplete,
      handleChangeIconComplete,
    } = this.props;
    return (
      <Popover
        overlayClassName="nodeStyle-popover"
        trigger={'click'}
        content={
          <StyleSetTabs
            handleChangeColorComplete={handleChangeColorComplete}
            handleChangeIconComplete={handleChangeIconComplete}
          />
        }
      >
        <div>
          <DisplayBtn icon={icon} color={color} />
        </div>
      </Popover>
    );
  }
}

export default VertexStyleSet;
