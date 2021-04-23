import { Button, Form, Input } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import React from 'react';
import intl from 'react-intl-universal';

import './index.less';

interface IProps extends FormComponentProps {
  onConfirm: (values) => void;
  onCancel: () => void;
}

class AddFilterForm extends React.PureComponent<IProps> {
  handleAddFilters = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props.onConfirm(values);
      }
    });
  };
  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <div className="form-add-filter">
        <Form hideRequiredMark={true}>
          <Form.Item label={intl.get('common.field')}>
            {getFieldDecorator(`field`, {
              rules: [
                {
                  required: true,
                },
              ],
            })(<Input placeholder="prop1" />)}
          </Form.Item>
          <Form.Item label={intl.get('explore.operator')}>
            {getFieldDecorator(`operator`, {
              rules: [
                {
                  required: true,
                },
              ],
            })(<Input placeholder="==" />)}
          </Form.Item>
          <Form.Item label={intl.get('explore.value')}>
            {getFieldDecorator(`value`, {
              rules: [
                {
                  required: true,
                },
              ],
            })(<Input placeholder="value" />)}
          </Form.Item>
        </Form>
        <div className="popover-footer">
          <Button onClick={this.handleAddFilters} type="primary">
            {intl.get('common.confirm')}
          </Button>
          <Button onClick={this.props.onCancel}>
            {intl.get('common.cancel')}
          </Button>
        </div>
      </div>
    );
  }
}

export default Form.create({
  mapPropsToFields(_props: IProps) {
    return {
      onConfirm: Form.createFormField({
        onConfirm: _props.onConfirm,
      }),
      onCancel: Form.createFormField({
        onCancel: _props.onCancel,
      }),
    };
  },
})(AddFilterForm);
