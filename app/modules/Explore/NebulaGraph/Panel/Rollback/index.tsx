import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#app/components/Button';
import { IDispatch, IRootState } from '#app/store';
import { INode, IPath } from '#app/utils/interface';

const mapState = (state: IRootState) => ({
  actionHistory: state.explore.actionHistory,
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateActionData: (actionHistory, edges, vertexes) => {
    dispatch.explore.update({
      actionHistory,
      edges,
      vertexes,
      selectVertexes: [],
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
  handlerRef?: (handler) => void;
}

class RollbackBtn extends React.PureComponent<IProps> {
  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        onKeydown: this.handleRollback,
      });
    }
  }

  handleRollback = () => {
    const { actionHistory } = this.props;
    if (actionHistory.length > 0) {
      const { actionHistory, vertexes, edges } = this.props;
      const data = actionHistory.pop() as any;
      if (data.type === 'ADD') {
        this.props.updateActionData(
          actionHistory,
          _.differenceBy(edges, data.edges, (e: IPath) => e.uuid),
          _.differenceBy(vertexes, data.vertexes, (v: INode) => v.uuid),
        );
      } else {
        this.props.updateActionData(
          actionHistory,
          _.unionBy(edges, data.edges, (e: IPath) => e.uuid),
          _.unionBy(vertexes, data.vertexes, (v: INode) => v.uuid),
        );
      }
    }
  };

  render() {
    const { actionHistory, showTitle } = this.props;
    return (
      <MenuButton
        tips={!showTitle ? intl.get('common.rollback') : undefined}
        iconfont="iconstudio-back"
        title={showTitle ? intl.get('common.rollback') : undefined}
        action={this.handleRollback}
        trackCategory="explore"
        trackAction="explore_rollback"
        trackLabel="from_panel"
        disabled={actionHistory.length === 0}
      />
    );
  }
}
export default connect(mapState, mapDispatch)(RollbackBtn);
