import { Button, Form, Modal as AntdModal, Select } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

import ImportNodes from './ImportNode';
import './index.less';

const Option = Select.Option;
const FormItem = Form.Item;

const mapState = (state: IRootState) => ({
  spaces: state.nebula.spaces,
  currentSpace: state.nebula.currentSpace,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncGetSpaces: dispatch.nebula.asyncGetSpaces,
  clear: () =>
    dispatch.explore.update({
      vertexes: [],
      edges: [],
      selectIds: [],
      actionData: [],
      step: 0,
    }),
  asyncSwitchSpace: async space => {
    await dispatch.nebula.asyncSwitchSpace(space);
    await dispatch.nebula.asyncGetTags();
    dispatch.explore.update({
      exploreRules: {},
    });
  },
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;
class Control extends React.Component<IProps, {}> {
  importNodesHandler;
  componentDidMount() {
    this.props.asyncGetSpaces();
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

  render() {
    const { spaces, currentSpace } = this.props;

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
          <Button type="default" onClick={this.handleClear}>
            {intl.get('explore.clear')}
          </Button>
          <Button
            type="primary"
            onClick={() => {
              if (this.importNodesHandler) {
                this.importNodesHandler.show();
              }
            }}
          >
            {intl.get('explore.importNode')}
          </Button>
          <Modal
            handlerRef={handler => (this.importNodesHandler = handler)}
            footer={null}
          >
            <ImportNodes handler={this.importNodesHandler} />
          </Modal>
        </FormItem>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Control);
