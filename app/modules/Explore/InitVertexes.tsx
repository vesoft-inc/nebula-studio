import { Button } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#app/components';
import { DEFAULT_EXPLORE_RULES } from '#app/config/explore';
import { IDispatch, IRootState } from '#app/store';

import './InitVertexes.less';
const mapState = (state: IRootState) => ({
  currentSpace: state.nebula.currentSpace,
  preloadData: state.explore.preloadData,
  vertexes: state.explore.vertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  clearExplore: () =>
    dispatch.explore.update({
      vertexes: [],
      edges: [],
      selectVertexes: [],
      selectEdges: [],
      actionHistory: [],
      step: 0,
      exploreRules: DEFAULT_EXPLORE_RULES,
    }),
  clearPreload: () =>
    dispatch.explore.update({
      preloadData: {
        vertexes: [],
        edges: [],
      },
    }),
  asyncGetExploreInfo: dispatch.explore.asyncGetExploreInfo,
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {}

class InitVertexes extends React.Component<IProps> {
  modalHandler;

  componentDidMount() {
    const { currentSpace, preloadData, vertexes } = this.props;
    if (currentSpace && preloadData.vertexes.length > 0) {
      vertexes.length > 0 ? this.modalHandler.show() : this.handleInsert();
    }
  }

  handleInsert = async(type?) => {
    if (type === 'clear') {
      await this.props.clearExplore();
    }
    this.modalHandler.hide();
    const { preloadData } = this.props;
    await this.props.asyncGetExploreInfo({ data: preloadData });
    await this.props.clearPreload();
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
