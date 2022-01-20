import { Button, Form, Input } from 'antd';
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
interface IProps extends ReturnType<typeof mapState> {
  onConfig: (form) => void;
}

const ConfigServerForm = ((props: IProps) => {
  const { onConfig, loading } = props;
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      layout="horizontal"
      {...fomrItemLayout}
      onFinish={onConfig}
      className="config-server-form"
    >
      <FormItem label={intl.get('configServer.host')} name="host" rules={hostRulesFn(intl)}>
        <Input placeholder="GraphD Host: Port" />
      </FormItem>
      <FormItem label={intl.get('configServer.username')} name="username" rules={usernameRulesFn(intl)}>
        <Input />
      </FormItem>
      <FormItem label={intl.get('configServer.password')} name="password" rules={passwordRulesFn(intl)}>
        <Input.Password />
      </FormItem>
      <Button
        type="primary"
        htmlType="submit"
        loading={!!loading}
      >
        {intl.get('configServer.connect')}
      </Button>
    </Form>
  );
});

export default connect(mapState)(ConfigServerForm);
