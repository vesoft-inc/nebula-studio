import { Button, Form, Input } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import React from 'react';
import intl from 'react-intl-universal';

import {
  hostRulesFn,
  passwordRulesFn,
  usernameRulesFn,
} from '#assets/config/rules';

import './index.less';

const FormItem = Form.Item;

const fomrItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 14 },
};

interface IProps extends FormComponentProps {
  onConfig: (form: WrappedFormUtils) => void;
}

const ConfigServerForm = Form.create<IProps>()((props: IProps) => {
  const { onConfig } = props;
  const { getFieldDecorator } = props.form;
  return (
    <Form
      layout="horizontal"
      {...fomrItemLayout}
      className="config-server-form"
    >
      <FormItem label={intl.get('configServer.host')}>
        {getFieldDecorator('host', {
          rules: hostRulesFn(intl),
        })(<Input />)}
      </FormItem>
      <FormItem label={intl.get('configServer.username')}>
        {getFieldDecorator('username', {
          rules: usernameRulesFn(intl),
        })(<Input />)}
      </FormItem>
      <FormItem label={intl.get('configServer.password')}>
        {getFieldDecorator('password', {
          rules: passwordRulesFn(intl),
        })(<Input />)}
      </FormItem>
      <Button type="primary" onClick={() => onConfig(props.form)}>
        {intl.get('configServer.connect')}
      </Button>
    </Form>
  );
});

export default ConfigServerForm;
