import { Button, Form, Input } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { FormInstance } from 'antd/es/form';

import './index.less';

interface IProps {
  onConfirm: (values) => void;
  onCancel: () => void;
}

class AddFilterForm extends React.PureComponent<IProps> {
  formRef = React.createRef<FormInstance>();
  handleAddFilters = () => {
    this.formRef.current!.validateFields().then(values => {
      this.props.onConfirm(values);
    }).catch(err => console.log('err', err));
  };
  render() {
    return (
      <div className="form-add-filter">
        <Form hideRequiredMark={true} ref={this.formRef}>
          <Form.Item label={intl.get('common.field')} name="field" rules={[{ required: true }]}>
            <Input placeholder="prop1" />
          </Form.Item>
          <Form.Item label={intl.get('explore.operator')} name="operator" rules={[{ required: true }]}>
            <Input placeholder="==" />
          </Form.Item>
          <Form.Item label={intl.get('explore.value')} name="value" rules={[{ required: true }]}>
            <Input placeholder="value" />
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

export default AddFilterForm;
