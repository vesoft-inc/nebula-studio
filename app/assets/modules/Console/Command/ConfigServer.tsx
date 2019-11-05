import { Button, Form, Icon, Input, message } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import cookies from 'js-cookie';
import React from 'react';
import intl from 'react-intl-universal';

import {
  hostRulesFn,
  passwordRulesFn,
  usernameRulesFn,
} from '../../../config/rules';
import service from '../../../config/service';
import './ConfigServer.less';

const FormItem = Form.Item;

interface IState {
  success: boolean;
}

class ConfigServer extends React.Component<FormComponentProps, IState> {
  connectInfo;
  constructor(props: FormComponentProps) {
    super(props);

    const host = cookies.get('host');
    const username = cookies.get('username');
    const password = cookies.get('password');
    this.connectInfo = {
      host,
      username,
      password,
    };
    this.state = {
      success: !!host && !!username && !!password,
    };
  }

  handleConnect = () => {
    this.props.form.validateFields(async (errs, data) => {
      if (!errs) {
        const { host, username, password } = data;
        const result = (await service.connectDB({
          username,
          host,
          password,
        })) as any;
        if (result.code === '0') {
          message.success(intl.get('configServer.success'));

          // save the nebula server info in cookie
          cookies.set('host', host);
          cookies.set('username', username);
          cookies.set('password', password);
          this.connectInfo = {
            host,
            username,
            password,
          };
          this.setState({
            success: true,
          });
        } else {
          message.error(`${intl.get('configServer.fail')}: ${result.message}`);
        }
      }
    });
  };

  handleClear = () => {
    cookies.remove('username');
    cookies.remove('password');
    cookies.remove('host');
    this.setState({
      success: false,
    });
  };

  renderSuccess = () => {
    const { host, username } = this.connectInfo;
    return (
      <div className="connect-server">
        <div className="icon-wrapper">
          <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" />
          <h3>{intl.get('configServer.success')}</h3>
          <p>
            <strong>{intl.get('configServer.host')}:</strong>
            <span>{host}</span>
            <strong>{intl.get('configServer.username')}:</strong>
            <span>{username}</span>
          </p>
          <Button size="small" onClick={this.handleClear}>
            {intl.get('configServer.clear')}
          </Button>
        </div>
      </div>
    );
  };

  render() {
    const { success } = this.state;
    if (success) {
      return this.renderSuccess();
    }

    const { getFieldDecorator } = this.props.form;
    const fomrItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 14 },
    };

    return (
      <div className="connect-server">
        <Form layout="horizontal" {...fomrItemLayout}>
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
          <Button type="primary" onClick={this.handleConnect}>
            {intl.get('configServer.connect')}
          </Button>
        </Form>
      </div>
    );
  }
}

export default Form.create()(ConfigServer);
