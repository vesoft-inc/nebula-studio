import { Select } from 'antd';
import Form, { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#assets/components';
import { DEFAULT_EXPLORE_RULES } from '#assets/config/explore';
import { IDispatch, IRootState } from '#assets/store';

const Option = Select.Option;

const mapState = (state: IRootState) => ({
  currentSpace: state.nebula.currentSpace,
  spaces: state.nebula.spaces,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncSwitchSpace: async space => {
    await dispatch.nebula.asyncSwitchSpace(space);
    await dispatch.nebula.asyncGetTags();
    await dispatch.nebula.asyncGetEdges();
    dispatch.explore.update({
      exploreRules: DEFAULT_EXPLORE_RULES,
    });
  },
  asyncGetTags: dispatch.nebula.asyncGetTags,
  asyncGetEdges: dispatch.nebula.asyncGetEdges,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps {}

class Init extends React.Component<IProps> {
  modalHandler;

  async componentDidMount() {
    const sessionSpace = sessionStorage.getItem('currentSpace');
    if (!this.props.currentSpace && !sessionSpace) {
      this.modalHandler.show();
    } else {
      await this.props.asyncGetTags();
      await this.props.asyncGetEdges();
    }
  }

  handleSelectChange = space => {
    this.props.asyncSwitchSpace(space);
    this.modalHandler.hide();
  };

  render() {
    const { spaces } = this.props;
    const { getFieldDecorator } = this.props.form;
    return (
      <Modal
        handlerRef={handler => (this.modalHandler = handler)}
        footer={null}
        closable={false}
        zIndex={8}
        maskClosable={false}
      >
        <h3>{intl.get('explore.selectSpace')}</h3>
        <Form>
          <Form.Item>
            {getFieldDecorator('space')(
              <Select onChange={this.handleSelectChange}>
                {spaces.map(space => (
                  <Option value={space} key={space}>
                    {space}
                  </Option>
                ))}
              </Select>,
            )}
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default connect(mapState, mapDispatch)(Form.create<IProps>()(Init));
