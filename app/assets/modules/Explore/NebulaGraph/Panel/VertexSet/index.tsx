import * as d3 from 'd3';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#assets/components/Button';
import VertexDisplay from '#assets/components/VertexDisplay';
import { IDispatch, IRootState } from '#assets/store';
import { INode } from '#assets/utils/interface';

import './index.less';

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
  currentColor: state.d3Graph.lastColor,
  currentIcon: state.d3Graph.lastIcon,
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
  updateVertexesIcon: (selectVertexes, icon) => {
    dispatch.explore.update({
      selectVertexes,
    });
    dispatch.d3Graph.update({
      lastIcon: icon,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
  disabled?: boolean;
  showIcon?: boolean;
  editing?: boolean;
}
interface IState {
  visible: boolean;
}
class VertexSet extends React.PureComponent<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  handleChangeColorComplete = color => {
    const { hex: _color } = color;
    const { selectVertexes, updateVertexesColor } = this.props;
    selectVertexes.forEach((vertex: INode) => (vertex.color = _color));
    updateVertexesColor(selectVertexes, _color);
    d3.selectAll('.active').style('fill', () => {
      return _color;
    });
  };

  handleChangeIconComplete = icon => {
    d3.selectAll('.active-node .icon').remove();
    const { selectVertexes, updateVertexesIcon } = this.props;
    selectVertexes.forEach((vertex: INode) => (vertex.icon = icon.type));
    updateVertexesIcon(selectVertexes, icon.type);

    d3.selectAll('.active-node')
      .append('text')
      .attr('class', 'icon')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('stroke', 'black')
      .attr('stroke-width', '0.001%')
      .attr('font-family', 'nebula-cloud-icon')
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y)
      .attr('id', (d: any) => d.uuid)
      .attr('font-size', '20px')
      .text(icon.content);
  };

  render() {
    const {
      showTitle,
      showIcon,
      editing,
      selectVertexes,
      currentColor,
      currentIcon
    } = this.props;
    return (
      <>
        <MenuButton
          tips={!showTitle ? intl.get('common.vertexSets') : undefined}
          disabled={selectVertexes.length === 0 || editing}
          component={
            <VertexDisplay
              showIcon={showIcon}
              handleChangeColorComplete={this.handleChangeColorComplete}
              handleChangeIconComplete={this.handleChangeIconComplete}
              selectVertexes={selectVertexes}
              currentColor={currentColor}
              currentIcon={currentIcon}
            />
          }
          title={showTitle ? intl.get('common.vertexSets') : undefined}
          trackCategory="explore"
          trackAction="color_picker"
          trackLabel="from_panel"
        />
      </>
    );
  }
}

export default connect(mapState, mapDispatch)(VertexSet);
