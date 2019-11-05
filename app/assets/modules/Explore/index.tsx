import React from 'react';
import { connect } from 'react-redux';

import { IDispatch, IRootState } from '../../store';

const mapState = (state: IRootState) => ({
  name: state.explore.name,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateName: dispatch.explore.updateName,
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

class Explore extends React.Component<IProps, {}> {
  render() {
    return (
      <button
        onClick={() => {
          this.props.updateName('1');
        }}
      >
        {this.props.name}
      </button>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(Explore);
