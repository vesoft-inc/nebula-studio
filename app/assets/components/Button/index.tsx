import { Icon, Tooltip } from 'antd';
import classnames from 'classnames';
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
  trackCategory?: string;
  trackAction?: string;
  trackLabel?: string;
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
    trackCategory,
    trackAction,
    trackLabel,
  } = props;
  return (
    <div
      className={classnames({
        'menu-color': className,
        'panel-btn-item': !className,
        'panel-disabled': disabled,
        'panel-actived': active,
      })}
      onClick={!disabled && action ? action : undefined}
      data-track-category={trackCategory}
      data-track-action={trackAction}
      data-track-label={trackLabel}
    >
      {icon && (
        <Icon
          type={icon}
          data-track-category={trackCategory}
          data-track-action={trackAction}
          data-track-label={trackLabel}
          className="panel-menu-icon"
        />
      )}
      {iconfont && (
        <IconFont
          type={iconfont}
          data-track-category={trackCategory}
          data-track-action={trackAction}
          data-track-label={trackLabel}
          className="panel-menu-icon"
        />
      )}
      {component}
      {title && <span>{title}</span>}
    </div>
  );
};

// antd Tooltip can't wrap custom component
const CustomizeTooltipBtn = (props: IMenuButton) => {
  const {
    icon,
    iconfont,
    action,
    disabled,
    active,
    tips,
    component,
    trackAction,
    trackCategory,
    trackLabel,
  } = props;
  return (
    <Tooltip title={tips}>
      {icon ? (
        <Icon
          type={icon}
          className={classnames('panel-menu-icon', {
            'panel-disabled': disabled,
            'panel-actived': active,
          })}
          data-track-category={trackCategory}
          data-track-action={trackAction}
          data-track-label={trackLabel}
          onClick={!disabled ? action : undefined}
        />
      ) : iconfont ? (
        <IconFont
          type={iconfont}
          className={classnames('panel-menu-icon', {
            'panel-disabled': disabled,
            'panel-actived': active,
          })}
          data-track-category={trackCategory}
          data-track-action={trackAction}
          data-track-label={trackLabel}
          onClick={!disabled ? action : undefined}
        />
      ) : (
        <div
          className={classnames({
            'panel-disabled': disabled,
            'panel-actived': active,
          })}
          onClick={!disabled && action ? action : undefined}
          data-track-category={trackCategory}
          data-track-action={trackAction}
          data-track-label={trackLabel}
        >
          {component}
        </div>
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
