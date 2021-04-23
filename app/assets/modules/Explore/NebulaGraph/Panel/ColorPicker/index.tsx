import * as d3 from 'd3';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#assets/components/Button';
import ColorPicker from '#assets/components/ColorPicker';
import {
  DEFAULT_COLOR_MIX,
  DEFAULT_COLOR_PICKER,
} from '#assets/config/explore';
import { IDispatch, IRootState } from '#assets/store';
import { INode } from '#assets/utils/interface';

import './index.less';

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
  currentColor: state.d3Graph.lastColor,
});
const mapDispatch = (dispatch: IDispatch) => ({
  updateVertexesColor: (selectVertexes, color) => {
    dispatch.explore.update({
      selectVertexes,
    });
    dispatch.d3Graph.update({
      lastColor: color,
    });
  },
});
interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  onChange?: (color) => void;
  showTitle?: string;
  customColor?: string;
  editing?: boolean;
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

const getColorIcon = props => {
  const {
    selectVertexes,
    currentColor,
    customColor,
    showTitle,
    editing,
  } = props;
  if (showTitle) {
    return (
      <>
        <div
          className={`btn-color ${
            !editing && selectVertexes.length === 0 ? 'btn-disabled' : ''
          }`}
          style={getColor(selectVertexes, currentColor, customColor)}
        />
        {showTitle && <span>{intl.get('common.color')}</span>}
      </>
    );
  } else {
    return (
      <div
        className={`btn-color ${
          !editing && selectVertexes.length === 0 ? 'btn-disabled' : ''
        }`}
        style={getColor(selectVertexes, currentColor, customColor)}
      />
    );
  }
};
class ColorPickerBtn extends React.PureComponent<IProps> {
  handleChangeColorComplete = color => {
    const { hex: _color } = color;
    if (this.props.onChange) {
      this.props.onChange(_color);
    } else {
      const { selectVertexes, updateVertexesColor } = this.props;
      selectVertexes.forEach((vertex: INode) => (vertex.color = _color));
      updateVertexesColor(selectVertexes, _color);
      d3.selectAll('.active').style('fill', () => {
        return _color;
      });
    }
  };
  // popover conflict with color picker
  // HACK: ColorPicker has no disable attr
  render() {
    const {
      selectVertexes,
      currentColor,
      showTitle,
      customColor,
      editing,
    } = this.props;
    return (
      <MenuButton
        component={
          editing || selectVertexes.length > 0 ? (
            <ColorPicker
              handleChangeColorComplete={this.handleChangeColorComplete}
            >
              {getColorIcon({
                selectVertexes,
                currentColor,
                showTitle,
                customColor,
                editing,
              })}
            </ColorPicker>
          ) : (
            getColorIcon({
              selectVertexes,
              currentColor,
              showTitle,
              customColor,
              editing,
            })
          )
        }
        className="menu-color"
        tips={!showTitle ? intl.get('common.color') : undefined}
        disabled={selectVertexes.length === 0 && !editing}
      />
    );
  }
}
export default connect(mapState, mapDispatch)(ColorPickerBtn);
