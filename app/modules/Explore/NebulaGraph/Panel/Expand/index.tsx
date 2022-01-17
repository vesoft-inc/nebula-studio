import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#app/components/Button';
import { IDispatch, IRootState } from '#app/store';

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncAutoExpand: dispatch.explore.asyncAutoExpand,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  handlerRef?: (handler) => void;
  showTitle?: boolean;
}

class ExpandBtn extends React.PureComponent<IProps> {
  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        onKeydown: this.props.asyncAutoExpand,
      });
    }
  }

  render() {
    const { showTitle, selectVertexes, asyncAutoExpand } = this.props;
    return (
      <>
        <MenuButton
          tips={!showTitle ? intl.get('explore.expand') : undefined}
          iconfont="iconstudio-expand"
          title={showTitle ? intl.get('explore.expand') : undefined}
          action={asyncAutoExpand}
          trackCategory="explore"
          trackAction="graph_expand"
          trackLabel="from_panel"
          disabled={selectVertexes.length === 0}
        />
      </>
    );
  }
}
export default connect(mapState, mapDispatch)(ExpandBtn);
