import { Select } from 'antd';
import Form, { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#assets/components';
import { IDispatch, IRootState } from '#assets/store';

const Option = Select.Option;

const mapState = (state: IRootState) => ({
  currentSpace: state.nebula.currentSpace,
  spaces: state.nebula.spaces,
});

const mapDispatch = (dispatch: IDispatch) => ({
  updateSpace: space => {
    dispatch.nebula.update({
      currentSpace: space,
    });
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    FormComponentProps {}

class Init extends React.Component<IProps> {
  modalHandler;

  componentDidMount() {
    // if no currentSpace opne the modal to select
    if (!this.props.currentSpace) {
      this.modalHandler.show();
    }
  }

  handleSelectChange = space => {
    this.props.updateSpace(space);
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
