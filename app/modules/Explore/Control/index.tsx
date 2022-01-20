import { Modal as AntdModal, Button, Form, Select } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import ImportNodes from './ImportNode';
import { Modal } from '#app/components';
import ExportBtn from '#app/modules/Explore/NebulaGraph/Panel/Export';
import { IDispatch, IRootState } from '#app/store';

import './index.less';

const Option = Select.Option;
const FormItem = Form.Item;

const mapState = (state: IRootState) => ({
  spaces: state.nebula.spaces,
  currentSpace: state.nebula.currentSpace,
  vertexes: state.explore.vertexes,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpaces: dispatch.nebula.asyncGetSpaces,
  clear: dispatch.explore.clear,
  asyncSwitchSpace: async space => {
    await dispatch.nebula.asyncSwitchSpace(space);
    await dispatch.nebula.asyncGetTags();
    await dispatch.nebula.asyncGetEdges();
    dispatch.explore.update({
      exploreRules: {},
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch> {
  onRef: any;
}

class Control extends React.Component<IProps> {
  importNodesHandler;
  componentDidMount() {
    this.props.asyncGetSpaces();
    this.props.onRef(this);
  }

  handleSelect = space => {
    AntdModal.confirm({
      content: intl.get('explore.selectReminder'),
      okText: intl.get('common.ok'),
      cancelText: intl.get('common.cancel'),
      onOk: () => {
        this.props.asyncSwitchSpace(space);
        this.props.clear();
      },
    });
  };

  handleClear = () => {
    AntdModal.confirm({
      content: intl.get('explore.clearTip'),
      okText: intl.get('common.ok'),
      cancelText: intl.get('common.cancel'),
      onOk: () => {
        this.props.clear();
      },
    });
  };

  handleSearch = () => {
    if (this.importNodesHandler) {
      this.importNodesHandler.show();
    }
  };

  render() {
    const { spaces, currentSpace, vertexes } = this.props;

    return (
      <div className="control">
        <FormItem className="left" label={intl.get('common.currentSpace')}>
          <Select onChange={this.handleSelect} value={currentSpace}>
            {spaces.map(space => (
              <Option value={space} key={space}>
                {space}
              </Option>
            ))}
          </Select>
        </FormItem>
        <FormItem className="right">
          <Button
            type="default"
            disabled={vertexes.length === 0}
            onClick={this.handleClear}
            data-track-category="explore"
            data-track-action="clear_canvas"
            data-track-label="from_control"
          >
            {intl.get('explore.clear')}
          </Button>
          <Button
            type="primary"
            data-track-category="explore"
            data-track-action="start_explore"
            data-track-label="from_control"
            onClick={() => {
              if (this.importNodesHandler) {
                this.importNodesHandler.show();
              }
            }}
          >
            {intl.get('explore.startWithVertices')}
          </Button>
          <ExportBtn disabled={vertexes.length === 0} />
          <Modal
            handlerRef={handler => (this.importNodesHandler = handler)}
            footer={null}
            width="650px"
          >
            <ImportNodes handler={this.importNodesHandler} />
          </Modal>
        </FormItem>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Control);
