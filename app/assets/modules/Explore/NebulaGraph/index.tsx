import React from 'react';
import { connect } from 'react-redux';

import { NebulaD3 } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

import Panel from './Pannel';

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
  selectVertexes: state.explore.selectVertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateSelectIds: (vertexes: any) => {
    dispatch.explore.update({
      selectVertexes: vertexes,
    });
  },
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;
class NebulaGraph extends React.Component<IProps, {}> {
  handleSelectVertexes = (nodes: any[]) => {
    this.props.updateSelectIds(nodes);
  };

  render() {
    const { vertexes, edges, selectVertexes } = this.props;
    return (
      <div className="graph-wrap">
        {selectVertexes.length !== 0 && <Panel />}
        <NebulaD3
          width={1200}
          height={900}
          data={{
            vertexes,
            edges,
            selectIdsMap: selectVertexes.reduce((dict: any, vertexe) => {
              dict[vertexe.name] = true;
              return dict;
            }, {}),
          }}
          onSelectVertexes={(nodes: any[]) => this.handleSelectVertexes(nodes)}
        />
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(NebulaGraph);
