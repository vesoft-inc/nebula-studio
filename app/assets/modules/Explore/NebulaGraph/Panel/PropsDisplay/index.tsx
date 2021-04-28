import { Button, Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#assets/components';
import MenuButton from '#assets/components/Button';
import { IDispatch, IRootState } from '#assets/store';

import './index.less';
import Setting from './setting';
const TabPane = Tabs.TabPane;

const mapState = (state: IRootState) => ({
  tagsFields: state.nebula.tagsFields,
  edgesFields: state.nebula.edgesFields,
  edges: state.explore.edges,
  tags: state.nebula.tags,
  edgeTypes: state.nebula.edgeTypes,
  showTagFields: state.explore.showTagFields,
  showEdgeFields: state.explore.showEdgeFields,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateShowingFields: fields => {
    dispatch.explore.update(fields);
  },
  asyncGetTagsFields: dispatch.nebula.asyncGetTagsFields,
  asyncGetEdgeTypesFields: dispatch.nebula.asyncGetEdgeTypesFields,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch> {
  showTitle?: boolean;
  handlerRef?: (handler) => void;
}

interface IState {
  tagType: string;
  _showTagFields: string[];
  _showEdgeFields: string[];
}
class PropsDisplayBtn extends React.PureComponent<IProps, IState> {
  modalHandler;
  constructor(props: IProps) {
    super(props);
    this.state = {
      tagType: 'tags',
      _showTagFields: [],
      _showEdgeFields: [],
    };
  }

  componentDidMount() {
    if (this.props.handlerRef) {
      this.props.handlerRef({
        onKeydown: this.handleOpenModal,
      });
    }
  }

  initCheckbox = () => {
    const { showTagFields, showEdgeFields } = this.props;
    this.setState({
      _showTagFields: showTagFields,
      _showEdgeFields: showEdgeFields,
    });
  };

  handleOpenModal = async () => {
    if (this.modalHandler) {
      await this.handleGetFields('tags');
      this.initCheckbox();
      this.modalHandler.show();
    }
  };

  handleClose = () => {
    if (this.modalHandler) {
      this.modalHandler.hide();
      this.initCheckbox();
    }
  };

  handleGetFields = async (type: string) => {
    if (type === 'tags') {
      const { asyncGetTagsFields, tags } = this.props;
      await asyncGetTagsFields({
        tags,
      });
    } else {
      const { asyncGetEdgeTypesFields, edgeTypes } = this.props;
      const _edgeTypes = edgeTypes.map(i => ({
        Name: i,
      }));
      await asyncGetEdgeTypesFields({
        edgeTypes: _edgeTypes,
      });
    }
  };

  handleChangeType = async (key: string) => {
    await this.handleGetFields(key);
    this.setState({
      tagType: key,
    });
  };

  updateShownFields = () => {
    const { _showEdgeFields, _showTagFields } = this.state;
    this.props.updateShowingFields({
      showTagFields: _showTagFields,
      showEdgeFields: _showEdgeFields,
    });
    this.handleClose();
  };

  handleUpdateSelectedFields = value => {
    const { tagType } = this.state;
    if (tagType === 'tags') {
      this.setState({ _showTagFields: value });
    } else {
      this.setState({ _showEdgeFields: value });
    }
  };

  render() {
    const { tagType, _showTagFields, _showEdgeFields } = this.state;
    const { tagsFields, edgesFields, showTitle } = this.props;
    return (
      <>
        <MenuButton
          tips={!showTitle ? intl.get('common.show') : undefined}
          iconfont="iconstudio-show"
          title={showTitle ? intl.get('common.show') : undefined}
          trackCategory="explore"
          trackAction="props_display"
          trackLabel="from_panel"
          action={this.handleOpenModal}
        />
        <Modal
          afterClose={this.handleClose}
          className="modal-setting-fields"
          width="700px"
          handlerRef={handler => (this.modalHandler = handler)}
          title={
            <Tabs onChange={this.handleChangeType} defaultActiveKey={tagType}>
              <TabPane tab={intl.get('explore.showTags')} key="tags" />
              <TabPane tab={intl.get('explore.showEdges')} key="edges" />
            </Tabs>
          }
          footer={null}
        >
          <Setting
            value={tagType === 'tags' ? _showTagFields : _showEdgeFields}
            fields={tagType === 'tags' ? tagsFields : edgesFields}
            onNameChange={this.handleUpdateSelectedFields}
          />
          <Button
            onClick={this.updateShownFields}
            type="primary"
            className="btn-confirm"
          >
            {intl.get('common.confirm')}
          </Button>
        </Modal>
      </>
    );
  }
}
export default connect(mapState, mapDispatch)(PropsDisplayBtn);
