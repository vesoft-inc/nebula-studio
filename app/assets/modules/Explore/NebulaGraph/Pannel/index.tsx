import { Button } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

import Expand from './Expand';
import './index.less';

const mapState = (state: IRootState) => ({
  vertexes: state.explore.vertexes,
  edges: state.explore.edges,
  selectVertexes: state.explore.selectVertexes,
  actionData: state.explore.actionData,
});

const mapDispatch = (dispatch: IDispatch) => ({
  delete: dispatch.explore.deleteNodesAndEdges,
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

class Panel extends React.Component<IProps, {}> {
  modalHandler;
  handleExpand = () => {
    if (this.modalHandler) {
      this.modalHandler.show();
    }
  };

  handleClose = () => {
    if (this.modalHandler) {
      this.modalHandler.hide();
    }
  };

  handleDelete = () => {
    const { vertexes, edges, selectVertexes, actionData } = this.props;
    this.props.delete({ vertexes, edges, selectVertexes, actionData });
  };

  render() {
    return (
      <div className="panel">
        <Button onClick={this.handleExpand}>
          {intl.get('explore.expand')}
        </Button>
        <Button onClick={this.handleDelete} className="panel-delete">
          {intl.get('explore.deleteSelectNodes')}
        </Button>
        <Modal
          handlerRef={handler => (this.modalHandler = handler)}
          width={800}
          maskClosable={false}
          footer={null}
        >
          <Expand close={this.handleClose} />
        </Modal>
      </div>
    );
  }
}
export default connect(mapState, mapDispatch)(Panel);
