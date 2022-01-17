import { Button, Form, Input } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import {
  hostRulesFn,
  passwordRulesFn,
  usernameRulesFn,
} from '#app/config/rules';
import { IRootState } from '#app/store';

import './index.less';

const FormItem = Form.Item;

const fomrItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 14 },
};
const mapState = (state: IRootState) => ({
  loading: state.loading.effects.nebula.asyncConfigServer,
});
interface IProps extends ReturnType<typeof mapState>, FormComponentProps {
  onConfig: (form: WrappedFormUtils) => void;
}

const ConfigServerForm = Form.create<IProps>()((props: IProps) => {
  const { onConfig, loading } = props;
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
        })(<Input placeholder="GraphD Host: Port" />)}
      </FormItem>
      <FormItem label={intl.get('configServer.username')}>
        {getFieldDecorator('username', {
          rules: usernameRulesFn(intl),
        })(<Input />)}
      </FormItem>
      <FormItem label={intl.get('configServer.password')}>
        {getFieldDecorator('password', {
          rules: passwordRulesFn(intl),
        })(<Input.Password />)}
      </FormItem>
      <Button
        type="primary"
        onClick={() => onConfig(props.form)}
        loading={!!loading}
      >
        {intl.get('configServer.connect')}
      </Button>
    </Form>
  );
});

export default connect(mapState)(ConfigServerForm);
