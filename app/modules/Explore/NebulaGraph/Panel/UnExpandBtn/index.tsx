import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#app/components/Button';
import { IDispatch, IRootState } from '#app/store';

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
  selectEdges: state.explore.selectEdges,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncUnExpand: dispatch.explore.asyncUnExpand,
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
  toolTipRef: any;
}

class UnExpandBtn extends React.PureComponent<IProps> {
  render() {
    const { selectVertexes, showTitle } = this.props;
    return (
      <MenuButton
        tips={!showTitle ? intl.get('explore.unExpand') : undefined}
        iconfont="iconstudio-unexpand"
        action={this.props.asyncUnExpand}
        title={showTitle ? intl.get('explore.unExpand') : undefined}
        trackCategory="explore"
        trackAction="node_undo_expand"
        trackLabel="from_panel"
        disabled={selectVertexes.length === 0}
      />
    );
  }
}
export default connect(mapState, mapDispatch)(UnExpandBtn);
