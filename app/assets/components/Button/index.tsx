import { Icon, Tooltip } from 'antd';
import React from 'react';

import IconFont from '#assets/components/Icon';

import './index.less';
interface IBtnProps {
  disabled?: boolean;
  action?: () => void;
  icon?: string;
  iconfont?: string;
  title?: string;
  className?: string;
  active?: boolean;
  component?: any;
}

interface IMenuButton extends IBtnProps {
  tips?: string;
}
const CustomizeButton = (props: IBtnProps) => {
  const {
    icon,
    iconfont,
    action,
    disabled,
    title,
    active,
    component,
    className,
  } = props;
  return (
    <div
      className={`${className ? 'menu-color' : 'panel-btn-item'} ${
        disabled ? 'panel-disabled' : ''
      } ${active ? 'panel-actived' : ''}`}
      onClick={!disabled && action ? action : undefined}
    >
      {icon && <Icon type={icon} className="panel-menu-icon" />}
      {iconfont && <IconFont type={iconfont} className="panel-menu-icon" />}
      {component}
      {title && <span>{title}</span>}
    </div>
  );
};

// antd Tooltip can't wrap custom component
const CustomizeTooltipBtn = (props: IMenuButton) => {
  const { icon, iconfont, action, disabled, active, tips, component } = props;
  return (
    <Tooltip title={tips}>
      {icon ? (
        <Icon
          type={icon}
          className={`panel-menu-icon ${disabled ? 'panel-disabled' : ''} ${
            active ? 'panel-actived' : ''
          }`}
          onClick={!disabled ? action : undefined}
        />
      ) : iconfont ? (
        <IconFont
          type={iconfont}
          className={`panel-menu-icon ${disabled ? 'panel-disabled' : ''} ${
            active ? 'panel-actived' : ''
          }`}
          onClick={!disabled ? action : undefined}
        />
      ) : (
        component
      )}
    </Tooltip>
  );
};

class MenuButton extends React.PureComponent<IMenuButton> {
  render() {
    const { tips, ...rest } = this.props;
    if (tips) {
      return <CustomizeTooltipBtn {...this.props} />;
    } else {
      return <CustomizeButton {...rest} />;
    }
  }
}
export default MenuButton;
