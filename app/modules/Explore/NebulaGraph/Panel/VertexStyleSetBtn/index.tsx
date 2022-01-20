import * as d3 from 'd3';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#app/components/Button';
import VertexStyleSet from '#app/components/VertexStyleSet';
import DisplayBtn from '#app/components/VertexStyleSet/DisplayBtn';
import { DEFAULT_COLOR_MIX } from '#app/config/explore';
import { IDispatch, IRootState } from '#app/store';
import { INode } from '#app/utils/interface';

import './index.less';

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateVertexesStyle: selectVertexes => {
    dispatch.explore.update({
      selectVertexes: [...selectVertexes],
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
  showIcon?: boolean;
}
interface IState {
  visible: boolean;
  color: string;
  icon: string;
}
class VertexStyleSetBtn extends React.PureComponent<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      color: DEFAULT_COLOR_MIX,
      icon: '',
    };
  }

  handleChangeColorComplete = color => {
    const { selectVertexes, updateVertexesStyle } = this.props;
    selectVertexes.forEach((vertex: INode) => (vertex.color = color));
    updateVertexesStyle(selectVertexes);
  };

  handleChangeIconComplete = icon => {
    d3.selectAll('.active-node .icon').remove();
    const { selectVertexes, updateVertexesStyle } = this.props;
    selectVertexes.forEach((vertex: INode) => (vertex.icon = icon.type));
    updateVertexesStyle(selectVertexes);
  };

  getUniqProperty = (list: INode[], prop: string) => {
    const props = _.uniq(list.map((i: INode) => i[prop]));
    if (props.length === 1) {
      return props[0];
    }
    return null;
  };
  getStyle = (list: INode[]) => {
    let color = DEFAULT_COLOR_MIX;
    let icon = '';
    if (list.length > 0) {
      color = this.getUniqProperty(list, 'color') || color;
      icon = this.getUniqProperty(list, 'icon') || icon;
    }
    this.setState({
      color,
      icon,
    });
  };

  componentDidUpdate() {
    this.getStyle(this.props.selectVertexes);
  }

  render() {
    const { showTitle, selectVertexes } = this.props;
    const { icon, color } = this.state;
    return (
      <>
        <MenuButton
          tips={!showTitle ? intl.get('explore.vertexStyle') : undefined}
          disabled={selectVertexes.length === 0}
          component={
            selectVertexes.length > 0 ? (
              <VertexStyleSet
                handleChangeColorComplete={this.handleChangeColorComplete}
                handleChangeIconComplete={this.handleChangeIconComplete}
                icon={icon}
                color={color}
              />
            ) : (
              <DisplayBtn icon={icon} color={color} />
            )
          }
          title={showTitle ? intl.get('explore.vertexStyle') : undefined}
          trackCategory="explore"
          trackAction="color_picker"
          trackLabel="from_panel"
        />
      </>
    );
  }
}

export default connect(mapState, mapDispatch)(VertexStyleSetBtn);
