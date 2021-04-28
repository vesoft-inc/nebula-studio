import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import MenuButton from '#assets/components/Button';
import { IDispatch, IRootState } from '#assets/store';

const mapState = (state: IRootState) => ({
  selectVertexes: state.explore.selectVertexes,
  selectEdges: state.explore.selectEdges,
});

const mapDispatch = (dispatch: IDispatch) => ({
  delete: dispatch.explore.deleteNodesAndEdges,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
  handlerRef?: (handler) => void;
  toolTipRef: any;
}

class DeleteBtn extends React.PureComponent<IProps> {
  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        onKeydown: this.onKeydown,
      });
    }
  }
  onKeydown = () => {
    const { selectVertexes, selectEdges } = this.props;
    if (selectVertexes.length > 0 || selectEdges.length > 0) {
      this.props.delete();
      this.props.toolTipRef.style('visibility', 'hidden');
    }
  };
  render() {
    const { selectVertexes, selectEdges, showTitle } = this.props;
    return (
      <MenuButton
        tips={!showTitle ? intl.get('common.delete') : undefined}
        iconfont="iconstudio-seletdelete"
        action={this.props.delete}
        title={showTitle ? intl.get('common.delete') : undefined}
        trackCategory="explore"
        trackAction="node_delete"
        trackLabel="from_panel"
        disabled={selectVertexes.length === 0 && selectEdges.length === 0}
      />
    );
  }
}
export default connect(mapState, mapDispatch)(DeleteBtn);
