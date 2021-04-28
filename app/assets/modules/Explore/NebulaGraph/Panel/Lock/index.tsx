import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#assets/components/Button';
import { IDispatch, IRootState } from '#assets/store';

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateSelectVertexes: selectVertexes => {
    dispatch.explore.update({
      selectVertexes,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
  handlerRef?: (handler) => void;
}

class LockBtn extends React.PureComponent<IProps> {
  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        onKeydown: this.handleLock,
      });
    }
  }

  handleLock = () => {
    const { selectVertexes, updateSelectVertexes } = this.props;
    const vertexes = selectVertexes.map((selectVertexe: any) => {
      selectVertexe.fx = selectVertexe.x;
      selectVertexe.fy = selectVertexe.y;
      selectVertexe.isFixed = true;
      return selectVertexe;
    });
    updateSelectVertexes(vertexes);
  };

  render() {
    const { selectVertexes, showTitle } = this.props;
    return (
      <MenuButton
        tips={!showTitle ? intl.get('common.lock') : undefined}
        iconfont="iconstudio-lock"
        title={showTitle ? intl.get('common.lock') : undefined}
        action={this.handleLock}
        trackCategory="explore"
        trackAction="node_lock"
        trackLabel="from_panel"
        disabled={selectVertexes.every(
          (selectVertexe: any) => selectVertexe.isFixed,
        )}
      />
    );
  }
}
export default connect(mapState, mapDispatch)(LockBtn);
