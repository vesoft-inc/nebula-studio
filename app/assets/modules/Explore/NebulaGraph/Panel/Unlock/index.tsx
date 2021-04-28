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

class UnlockBtn extends React.Component<IProps> {
  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        onKeydown: this.handleUnlock,
      });
    }
  }

  handleUnlock = () => {
    const { selectVertexes, updateSelectVertexes } = this.props;
    const vertexes = selectVertexes.map((selectVertexe: any) => {
      selectVertexe.fx = null;
      selectVertexe.fy = null;
      selectVertexe.isFixed = false;
      return selectVertexe;
    });
    updateSelectVertexes(vertexes);
  };

  render() {
    const { selectVertexes, showTitle } = this.props;
    return (
      <MenuButton
        tips={!showTitle ? intl.get('common.unlock') : undefined}
        iconfont="iconstudio-unlock"
        title={showTitle ? intl.get('common.unlock') : undefined}
        action={this.handleUnlock}
        trackCategory="explore"
        trackAction="node_unlock"
        trackLabel="from_panel"
        disabled={
          selectVertexes.length === 0 ||
          selectVertexes.some((selectVertexe: any) => !selectVertexe.isFixed)
        }
      />
    );
  }
}
export default connect(mapState, mapDispatch)(UnlockBtn);
