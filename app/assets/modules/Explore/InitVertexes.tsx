import { Button } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

import './InitVertexes.less';
const mapState = (state: IRootState) => ({
  currentSpace: state.nebula.currentSpace,
  preloadVertexes: state.explore.preloadVertexes,
  vertexes: state.explore.vertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  clearExplore: () =>
    dispatch.explore.update({
      vertexes: [],
      edges: [],
      selectVertexes: [],
      actionData: [],
      step: 0,
      exploreRules: {
        edgeTypes: [],
        edgeDirection: '',
        vertexColor: '',
      },
    }),
  clearPreload: () =>
    dispatch.explore.update({
      preloadVertexes: [],
    }),
  asyncImportNodes: dispatch.explore.asyncImportNodes,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {}

class InitVertexes extends React.Component<IProps> {
  modalHandler;

  componentDidMount() {
    const { currentSpace, preloadVertexes, vertexes } = this.props;
    if (currentSpace && preloadVertexes.length > 0) {
      vertexes.length > 0 ? this.modalHandler.show() : this.handleInsert();
    }
  }

  handleInsert = async (type?) => {
    const idsText = this.props.preloadVertexes.join('\n');
    if (type === 'clear') {
      await this.props.clearExplore();
    }
    await this.props.asyncImportNodes({ idsText });
    await this.props.clearPreload();
    this.modalHandler.hide();
  };

  render() {
    return (
      <Modal
        className="modal-insert"
        handlerRef={handler => (this.modalHandler = handler)}
        footer={null}
        closable={false}
        zIndex={8}
        centered={true}
        maskClosable={false}
      >
        <p>{intl.get('explore.insertMethodSelect')}</p>
        <div className="btn-operation">
          <Button type="primary" onClick={() => this.handleInsert('clear')}>
            {intl.get('explore.insertAfterClear')}
          </Button>
          <Button type="primary" onClick={this.handleInsert}>
            {intl.get('explore.incrementalInsertion')}
          </Button>
        </div>
      </Modal>
    );
  }
}

export default connect(mapState, mapDispatch)(InitVertexes);
