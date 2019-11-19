import * as d3 from 'd3';
import React from 'react';
import { connect } from 'react-redux';

import { NebulaD3 } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

import './index.less';
import Panel from './Pannel';

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
  selectIds: state.explore.selectIds,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateSelectIds: (ids: any) => {
    dispatch.explore.update({
      selectIds: ids,
    });
  },
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;
class NebulaGraph extends React.Component<IProps, {}> {
  $tooltip;
  handleSelectVertexes = (nodes: any[]) => {
    this.props.updateSelectIds(nodes.map(n => n.name));
  };

  handleMouseInNode = node => {
    this.$tooltip
      .transition()
      .duration(200)
      .style('opacity', 0.95);
    this.$tooltip
      .html(`<p>${node.name}</p>`)
      .style('left', `${node.x}px`)
      .style('top', `${node.y - 80}px`);
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

  componentDidMount() {
    // render tootlip into dom
    this.$tooltip = d3
      .select('#J_Graph')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);

    this.$tooltip.on('mouseout', this.hideTooltip);
  }

  render() {
    const { vertexes, edges, selectIds } = this.props;
    return (
      <div className="graph-wrap" id="J_Graph">
        {selectIds.length !== 0 && <Panel />}
        <NebulaD3
          width={1200}
          height={900}
          data={{
            vertexes,
            edges,
            selectIdsMap: selectIds.reduce((dict: any, id) => {
              dict[id] = true;
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
