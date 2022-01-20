import { Carousel, Popover } from 'antd';
import { chunk } from 'lodash';
import React from 'react';

import IconCfg from './iconCfg';
import Icon from '#app/components/Icon';

import './index.less';

interface IIcon {
  type: string;
  content: string;
}

interface IProps {
  handleChangeIconComplete?: (icon: IIcon) => void;
}

const iconGroup = chunk(IconCfg, 16);

interface IIconItem {
  onClick: (icon: IIcon) => void;
  icon: IIcon;
}

const IconItem = (props: IIconItem) => {
  const {
    onClick,
    icon: { type, content },
  } = props;
  const iconElement = (
    <Icon type={type} key={type} onClick={() => onClick(props.icon)} />
  );

  return (
    <div className="icon-box">
      {!!content ? (
        iconElement
      ) : (
        <Popover content="Remove Icon">{iconElement}</Popover>
      )}
    </div>
  );
};

class IconPickerBtn extends React.PureComponent<IProps> {
  handleChangeIconComplete = (icon: IIcon) => {
    this.props.handleChangeIconComplete?.(icon);
  };

  render() {
    return (
      <div className="icon-picker">
        <Carousel lazyLoad="progressive" dots={true}>
          {iconGroup.map((group, index) => (
            <div className="icon-group" key={index}>
              {group.map(icon => (
                <IconItem
                  icon={icon}
                  key={icon.type}
                  onClick={this.handleChangeIconComplete}
                />
              ))}
            </div>
          ))}
        </Carousel>
      </div>
    );
  }
}
export default IconPickerBtn;
