import * as d3 from 'd3';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#app/components/Button';
import { MAX_SCALE, MIN_SCALE } from '#app/config/explore';
import { IDispatch, IRootState } from '#app/store';
const mapState = (state: IRootState) => ({
  offsetX: state.d3Graph.canvasOffsetX,
  offsetY: state.d3Graph.canvasOffsetY,
  scale: state.d3Graph.canvasScale,
  vertexes: state.explore.vertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateScaleData: (data: number) => {
    dispatch.d3Graph.update({
      canvasScale: data,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {
  type: string;
  showTitle?: boolean;
  handlerRef?: (handler) => void;
}

class ZoomBtn extends React.PureComponent<IProps> {
  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        onKeydown: this.handleZoom,
      });
    }
  }
  getScaleValue = () => {
    const { scale, type } = this.props;
    let number;
    if (type === 'zoom-out' && scale > MIN_SCALE) {
      number = scale * 0.9 < MIN_SCALE ? MIN_SCALE : scale * 0.9;
    } else if (type === 'zoom-in' && scale < 1) {
      number = scale * 1.1 > MAX_SCALE ? MAX_SCALE : scale * 1.1;
    }
    return number;
  };

  handleZoom = () => {
    const { offsetX, offsetY, vertexes } = this.props;
    if (vertexes.length > 0) {
      const value = this.getScaleValue();
      if (value) {
        this.props.updateScaleData(value);
        d3.select('.nebula-d3-canvas')
          .transition()
          .duration(500)
          .attr(
            'transform',
            `translate(${offsetX},${offsetY}) scale(${value})`,
          );
      }
    }
  };

  render() {
    const { type, vertexes, scale, showTitle } = this.props;
    return (
      <>
        {type === 'zoom-out' && (
          <MenuButton
            tips={!showTitle ? intl.get('common.zoomOut') : undefined}
            iconfont="iconstudio-zoomout"
            title={showTitle ? intl.get('common.zoomOut') : undefined}
            action={this.handleZoom}
            disabled={vertexes.length === 0 || scale === MIN_SCALE}
            trackCategory="explore"
            trackAction="canvas_zoom_out"
            trackLabel="from_panel"
          />
        )}
        {type === 'zoom-in' && (
          <MenuButton
            tips={!showTitle ? intl.get('common.zoomIn') : undefined}
            iconfont="iconstudio-zoomin"
            title={showTitle ? intl.get('common.zoomIn') : undefined}
            action={this.handleZoom}
            disabled={vertexes.length === 0 || scale === MAX_SCALE}
            trackCategory="explore"
            trackAction="canvas_zoom_in"
            trackLabel="from_panel"
          />
        )}
      </>
    );
  }
}
export default connect(mapState, mapDispatch)(ZoomBtn);
