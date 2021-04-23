import * as d3 from 'd3';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#assets/components/Button';
import { MAX_SCALE, MIN_SCALE } from '#assets/config/explore';
import { IDispatch, IRootState } from '#assets/store';

const mapState = (state: IRootState) => ({
  scale: state.d3Graph.canvasScale,
  isZoom: state.d3Graph.isZoom,
  vertexes: state.explore.vertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateD3GraphData: data => {
    dispatch.d3Graph.update(data);
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
}

class MoveBtn extends React.PureComponent<IProps> {
  handleStartZoom = () => {
    const { isZoom, updateD3GraphData } = this.props;
    const svg = d3.select('#output-graph') as any;
    if (isZoom) {
      svg.on('.zoom', null);
      updateD3GraphData({
        isZoom: false,
      });
    } else {
      svg.call(
        d3
          .zoom()
          .scaleExtent([MIN_SCALE, MAX_SCALE])
          .on('zoom', this.changeTranslatePosition) // on events cannot get the latest scale value when it changes, need to call function rather than write in the event
          .on('end', () => {
            updateD3GraphData({
              canvasOffsetX: d3.event.transform.x,
              canvasOffsetY: d3.event.transform.y,
              // canvasScale: d3.event.transform.k, // TODO: scale cancel the fixed, supports scroll zoom
            });
          }),
      );
      updateD3GraphData({
        isZoom: true,
      });
    }
  };

  changeTranslatePosition = () => {
    const { scale } = this.props;
    d3.select('.nebula-d3-canvas').attr(
      'transform',
      `translate(${d3.event.transform.x},${d3.event.transform.y}) scale(${scale})`,
    );
  };

  render() {
    const { isZoom } = this.props;
    const { vertexes, showTitle } = this.props;
    return (
      <MenuButton
        tips={intl.get('common.move')}
        iconfont="iconstudio-moving"
        action={this.handleStartZoom}
        disabled={vertexes.length === 0}
        title={showTitle ? intl.get('common.move') : undefined}
        active={isZoom ? true : false}
      />
    );
  }
}
export default connect(mapState, mapDispatch)(MoveBtn);
