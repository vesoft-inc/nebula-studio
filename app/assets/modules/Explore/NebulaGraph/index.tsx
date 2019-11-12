import React from 'react';
import { connect } from 'react-redux';

import { NebulaToD3Data } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

import Panel from './Pannel';

const mapState = (state: IRootState) => ({
  vertexs: state.explore.vertexs,
  edges: state.explore.edges,
  ids: state.explore.ids,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateIds: (ids: any) => {
    dispatch.explore.update({
      ids,
    });
  },
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;
class NebulaGraph extends React.Component<IProps, {}> {
  handleSelectVertex = (_ids: any[]) => {
    this.props.updateIds(_ids);
  };

  render() {
    const { vertexs, edges, ids } = this.props;
    return (
      <div className="graph-wrap">
        {ids.length !== 0 && <Panel />}
        <NebulaToD3Data
          width={1200}
          height={900}
          data={{ vertexs, edges }}
          onSelectVertex={(_ids: any[]) => this.handleSelectVertex(_ids)}
        />
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(NebulaGraph);
