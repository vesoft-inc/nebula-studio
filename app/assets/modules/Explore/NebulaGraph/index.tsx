import { Button } from 'antd';
import * as d3 from 'd3';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { NebulaD3 } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

import './index.less';
import Panel from './Pannel';

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
  selectVertexes: state.explore.selectVertexes,
  actionData: state.explore.actionData,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateSelectIds: (vertexes: any) => {
    dispatch.explore.update({
      selectVertexes: vertexes,
    });
  },
  updateActionData: (actionData, edges, vertexes) => {
    dispatch.explore.update({
      actionData,
      edges,
      vertexes,
      selectVertexes: [],
    });
  },
});

interface IState {
  width: number;
  height: number;
}

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

class NebulaGraph extends React.Component<IProps, IState> {
  $tooltip;
  ref: HTMLDivElement;

  constructor(props: IProps) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
    };
  }

  handleSelectVertexes = (nodes: any[]) => {
    this.props.updateSelectIds(nodes);
  };

  componentDidMount() {
    // render tootlip into dom
    const { clientWidth, clientHeight } = this.ref;
    this.setState({
      width: clientWidth,
      height: clientHeight,
    });

    this.$tooltip = d3
      .select(this.ref)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    window.addEventListener('resize', this.handleResize);

    this.$tooltip.on('mouseout', this.hideTooltip);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleMouseInNode = node => {
    this.$tooltip
      .transition()
      .duration(200)
      .style('opacity', 0.95);
    this.$tooltip.html(`<p>id: ${node.name}</p>`);
  };

  handleMouseOutNode = () => {
    this.$tooltip
      .transition()
      .duration(500)
      .style('opacity', 0);
  };

  hideTooltip = () => {
    this.$tooltip.style('opacity', 0);
  };

  handleResize = () => {
    const { clientWidth, clientHeight } = this.ref;
    this.setState({
      width: clientWidth,
      height: clientHeight,
    });
  };

  handleUndo = () => {
    const { actionData, vertexes, edges } = this.props;
    const data = actionData.pop();
    this.props.updateActionData(
      actionData,
      _.differenceBy(edges, data.edges, (e: any) => e.id),
      _.differenceBy(vertexes, data.vertexes, (v: any) => v.name),
    );
  };

  render() {
    const { vertexes, edges, selectVertexes, actionData } = this.props;
    const { width, height } = this.state;
    return (
      <div
        className="graph-wrap"
        ref={(ref: HTMLDivElement) => (this.ref = ref)}
      >
        {selectVertexes.length !== 0 && <Panel />}
        {actionData.length !== 0 && (
          <Button className="history-undo" onClick={this.handleUndo}>
            {intl.get('explore.undo')}
          </Button>
        )}
        <NebulaD3
          width={width}
          height={height}
          data={{
            vertexes,
            edges,
            selectIdsMap: selectVertexes.reduce((dict: any, vertexe) => {
              dict[vertexe.name] = true;
              return dict;
            }, {}),
          }}
          onMouseInNode={this.handleMouseInNode}
          onMouseOutNode={this.handleMouseOutNode}
          onSelectVertexes={this.handleSelectVertexes}
        />
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(NebulaGraph);
