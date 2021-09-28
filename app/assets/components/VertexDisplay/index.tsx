import { Popover, Tabs } from 'antd';
import classnames from 'classnames';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';

import ColorPicker from '#assets/components/ColorPicker';
import Icon from '#assets/components/Icon';
import IconPicker from '#assets/components/IconPicker';
import {
  DEFAULT_COLOR_MIX,
  DEFAULT_COLOR_PICKER,
} from '#assets/config/explore';
import { INode } from '#assets/utils/interface';

interface IIcon {
  type: string;
  content: string
}

interface IProps{
  disabled?: boolean;
  showIcon?: boolean;
  editing?: boolean;
  customColor?: string;
  customIcon?: string;
  selectVertexes?: any;
  currentColor?: string;
  currentIcon?: string;
  handleChangeColorComplete: (color: string) => void;
  handleChangeIconComplete?: (icon: IIcon) => void;
}

const getColor = (list: INode[], color, customColor) => {
  let _color = DEFAULT_COLOR_PICKER;
  if (customColor) {
    return {
      background: customColor,
    };
  }
  if (list.length > 0) {
    const colors = _.uniq(list.map((i: INode) => i.color));
    if (colors.length > 1) {
      return {
        backgroundImage: DEFAULT_COLOR_MIX,
      };
    } else if (colors.length === 1) {
      _color = colors[0] || DEFAULT_COLOR_PICKER;
    }
  } else if (color) {
    _color = color;
  }
  return {
    background: _color,
  };
};

const getIcon = (list: INode[], icon, customIcon) => {
  let _icon = '';
  if (customIcon !== undefined) {
    if (customIcon === 'iconimage-iconUnselect') {
      customIcon = '';
    }
    return customIcon;
  }
  if (list.length > 0) {
    const icons = _.uniq(
      list.map((i: INode) => {
        return i.icon;
      }),
    );
    if (icons.length > 1) {
      return '';
    } else if (icons.length === 1) {
      _icon = icons[0] || '';
    }
  } else if (icon) {
    _icon = icon;
  }
  if (_icon === 'iconimage-iconUnselect') {
    _icon = '';
  }
  return _icon;
};

class VertexDisplay extends React.PureComponent<IProps> {
  render() {
    const {
      showIcon,
      currentIcon,
      customIcon,
      selectVertexes,
      customColor,
      currentColor,
      editing,
    } = this.props;
    return (
      <>
        {selectVertexes?.length !== 0 || editing ? (
          <Popover
            overlayClassName="nodeStyle-popover"
            trigger={'click'}
            content={
              <Tabs className="tab-type-set">
                <Tabs.TabPane tab={intl.get('common.color')} key="color">
                  <ColorPicker
                    handleChangeColorComplete={
                      this.props.handleChangeColorComplete
                    }
                  />
                </Tabs.TabPane>
                <Tabs.TabPane tab={intl.get('common.icon')} key="icon">
                  <IconPicker
                    handleChangeIconComplete={
                      this.props.handleChangeIconComplete
                    }
                  />
                </Tabs.TabPane>
              </Tabs>
            }
          >
            <div className="btn-nodeStyle-set">
              <div className="color-group">
                <div
                  className={classnames('btn-color')}
                  style={getColor(selectVertexes, currentColor, customColor)}
                >
                  {showIcon && (
                    <Icon
                      className="icon-selected"
                      type={getIcon(selectVertexes, currentIcon, customIcon)}
                    />
                  )}
                </div>
              </div>
            </div>
          </Popover>
        ) : (
          <div className="btn-nodeStyle-set">
            <div className="color-group">
              <div
                className={classnames('btn-color')}
                style={getColor(selectVertexes, currentColor, customColor)}
              >
                {showIcon && (
                  <Icon
                    className="icon-selected"
                    type={getIcon(selectVertexes, currentIcon, customIcon)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default VertexDisplay;
