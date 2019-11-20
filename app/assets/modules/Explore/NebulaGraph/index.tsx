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

interface IState {
  width: number;
  height: number;
}

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;
class NebulaGraph extends React.Component<IProps, IState> {
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
    const { clientWidth, clientHeight } = this.ref;
    this.setState({
      width: clientWidth,
      height: clientHeight,
    });
  }

  render() {
    const { vertexes, edges, selectVertexes } = this.props;
    const { width, height } = this.state;
    return (
      <div
        className="graph-wrap"
        ref={(ref: HTMLDivElement) => (this.ref = ref)}
      >
        {selectVertexes.length !== 0 && <Panel />}
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
