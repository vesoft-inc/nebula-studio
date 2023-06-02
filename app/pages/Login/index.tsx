import { Button, Form, Input, Col, Row } from 'antd';
import { useEffect, useState } from 'react';
import { useI18n } from '@vesoft-inc/i18n';
import { hostRulesFn, portRulesFn, passwordRulesFn, usernameRulesFn } from '@app/config/rules';
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
  const { intl } = useI18n();
  const [loading, setLoading] = useState(false);
  const onConfig = async (values: any) => {
    setLoading(true);
    const ok = await global.login(values);
    !ok && setTimeout(() => setLoading(false), 400);
  };

  useEffect(() => {
    trackPageView('/login');
  }, []);
  return (
    <div className={styles.studioLogin}>
      <div className={styles.content}>
        <div className={styles.header}>
          <img className={styles.logo} src={nebulaLogo} />
          <span className={styles.title}>{`${window.gConfig.databaseName} Studio`}</span>
        </div>
        <Form className={styles.loginForm} layout="horizontal" {...fomrItemLayout} onFinish={onConfig}>
          <FormItem noStyle>
            <span className={styles.formTitle}>{intl.get('configServer.title')}</span>
          </FormItem>
          <Button type="link" className={styles.loginTip} onClick={() => window.open(intl.get('link.loginHref'), '_blank')}>
            {intl.get('configServer.tip')}
          </Button>
          <Row>
            <Col span={12}>
              <FormItem name="address" rules={hostRulesFn()}>
                <Input placeholder={intl.get('configServer.host')} />
              </FormItem>
            </Col>
            <Col span={1}>
              <FormItem noStyle>
                <span className={styles.split}>:</span>
              </FormItem>
            </Col>
            <Col span={11}>
              <FormItem name="port" rules={portRulesFn()} initialValue={9669}>
                <Input placeholder={intl.get('configServer.port')} />
              </FormItem>
            </Col>
          </Row>
          <FormItem name="username" rules={usernameRulesFn()}>
            <Input placeholder={intl.get('configServer.username')} />
          </FormItem>
          <FormItem name="password" rules={passwordRulesFn()}>
            <Input.Password placeholder={intl.get('configServer.password')} />
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
