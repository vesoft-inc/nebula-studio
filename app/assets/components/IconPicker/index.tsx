import { Carousel, Popover } from 'antd';
import { chunk } from 'lodash';
import React from 'react';
import Icon from '#assets/components/Icon';
import IconCfg from './iconCfg';
import './index.less';

interface IIcon {
  type: string;
  content: string
}

interface IProps {
  handleChangeIconComplete?: (icon: IIcon) => void;
}

const iconGroup = chunk(IconCfg, 16);

function IconItem<T extends IIcon>({ icon, onClick }: { icon: T; onClick: (icon: T) => void; }) {
  const { type, content } = icon;
  const iconElement = <Icon type={type} key={type} onClick={() => onClick(icon)} />;

  return (
    <div className="icon-box">
      {!!content ? iconElement : <Popover content="Remove Icon">{iconElement}</Popover>}
    </div>
  );
}

class IconPickerBtn extends React.PureComponent<IProps> {
  handleChangeIconComplete = (icon: IIcon) => {
      this.props.handleChangeIconComplete?.(icon);
  };

  render() {
    return (
      <div className="icon-picker">
        <Carousel lazyLoad="progressive" dots>
          {iconGroup.map((group, index) => (
            <div className="icon-group" key={index}>
              {group.map(icon => (
                <IconItem 
                  icon={icon}
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
