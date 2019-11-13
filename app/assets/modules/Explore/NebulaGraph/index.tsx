import React from 'react';
import { connect } from 'react-redux';

import { NebulaD3 } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

import Panel from './Pannel';

const mapState = (state: IRootState) => ({
  vertexs: state.explore.vertexs,
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
  handleSelectVertexes = (nodes: any[]) => {
    this.props.updateSelectIds(nodes.map(n => n.name));
  };

  render() {
    const { vertexs, edges, selectIds } = this.props;
    return (
      <div className="graph-wrap">
        {selectIds.length !== 0 && <Panel />}
        <NebulaD3
          width={1200}
          height={900}
          data={{
            vertexs,
            edges,
            selectIdsMap: selectIds.reduce((dict: any, id) => {
              dict[id] = true;
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
