import { Button, Form, Input } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useLocation } from 'react-router-dom';
import { hostRulesFn, passwordRulesFn, usernameRulesFn } from '@app/config/rules';
import { observer } from 'mobx-react-lite';
import { trackPageView } from '@app/utils/stat';
import { useStore } from '@app/stores';
import nebulaLogo from '@app/static/images/nebula_logo.png';
import LanguageSelect from './LanguageSelect';

import styles from './index.module.less';

const FormItem = Form.Item;

const fomrItemLayout = {
  wrapperCol: {
    span: 24,
  },
};

const LoginPage: React.FC = () => {
  const { global } = useStore();
  const { version } = global;
  const history = useHistory();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const onConfig = async (values: any) => {
    setLoading(true);
    const ok = await global.login(values);
    setLoading(false);
    setTimeout(() => {
      ok && history.replace(`/console${location.search}`);
    }, 400);
  };

  useEffect(() => {
    trackPageView('/login');
  }, []);

  return (
    <div className={styles.studioLogin}>
      <div className={styles.content}>
        <div className={styles.header}>
          <img className={styles.logo} src={nebulaLogo} />
          <span className={styles.title}>Nebula Studio</span>
        </div>
        <Form className={styles.loginForm} layout="horizontal" {...fomrItemLayout} onFinish={onConfig}>
          <FormItem noStyle>
            <span className={styles.formTitle}>{intl.get('configServer.title')}</span>
          </FormItem>
          <FormItem name="host" rules={hostRulesFn()}>
            <Input placeholder={intl.get('configServer.host')} bordered={false} />
          </FormItem>
          <FormItem name="username" rules={usernameRulesFn()}>
            <Input placeholder={intl.get('configServer.username')} bordered={false} />
          </FormItem>
          <FormItem name="password" rules={passwordRulesFn()}>
            <Input.Password placeholder={intl.get('configServer.password')} bordered={false} />
          </FormItem>
          <Button className={styles.btnSubmit} type="primary" htmlType="submit" loading={loading}>
            {intl.get('configServer.connect')}
          </Button>
        </Form>
        <div className={styles.footer}>
          <div className={styles.info}>
            <span className={styles.version}>
              {intl.get('common.version')}：v{version}
            </span>
            <LanguageSelect />
          </div>
        </div>
      </div>
    </div>
  );
};
export default observer(LoginPage);
