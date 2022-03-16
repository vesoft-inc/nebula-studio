import classnames from 'classnames';
import React from 'react';

import Icon from '@app/components/Icon';
import './index.less';
interface IBtnProps {
  disabled?: boolean;
  action?: () => void;
  mouseDownAction?: () => void;
  mouseUpAction?: () => void;
  icon?: string;
  title?: string;
  className?: string;
  actived?: boolean;
  component?: any;
  trackCategory?: string;
  trackAction?: string;
  trackLabel?: string;
}

interface IMenuButton extends IBtnProps {
  tips?: string;
  id?:string;
}
const MenuButton: React.FC<IMenuButton> = (props: IMenuButton) => {
  const { icon, action, disabled, title, actived, component, className, trackCategory, trackAction, trackLabel } =
  props;
  return <div
    className={classnames(
      {
        'btn-disabled': disabled,
        'btn-actived': actived,
      },
      className,
    )}
    onClick={e => {
      e.preventDefault();
      if (!disabled && action) {
        action();
      }
    }}
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
        className="btn-icon"
      />
    )}
    {component}
    {title && <span>{title}</span>}
  </div>;
};
export default MenuButton;
