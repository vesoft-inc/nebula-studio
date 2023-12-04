import { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Col, Form, Input, InputNumber, Row, Select, Switch, message } from 'antd';
import { useI18n } from '@vesoft-inc/i18n';
import { useStore } from '@app/stores';
// import LanguageSelect from '@app/components/LanguageSelect';
import { trackEvent } from '@app/utils/stat';
import styles from './index.module.less';
import LanguageSelect from '../Login/LanguageSelect';
import { useForm } from 'antd/lib/form/Form';
import { post } from '@app/utils/http';

const Setting = observer(() => {
  const { intl } = useI18n();
  const { global, llm } = useStore();
  const { appSetting, saveAppSetting } = global;
  const [form] = useForm();
  const [apiType, setApiType] = useState('openai');
  useEffect(() => {
    initForm();
  }, []);

  const initForm = async () => {
    await llm.fetchConfig();
    form.setFieldsValue(llm.config);
    setApiType(llm.config.apiType);
  };

  const updateAppSetting = useCallback(async (param: Partial<any['beta']>) => {
    // make it loading for a while, so it looks more smooth
    saveAppSetting({ beta: { ...global?.appSetting?.beta, ...param } });
    trackEvent('setting', 'update_app_setting');
  }, []);

  const onSubmitLLMForm = useCallback(() => {
    form.validateFields().then((values) => {
      const { apiType, url, key, maxContextLength, ...config } = values;
      post('/api/config/llm')({
        apiType,
        url,
        key,
        maxContextLength,
        config: JSON.stringify(config),
      }).then((res) => {
        if (res.code === 0) {
          message.success(intl.get('common.success'));
          llm.setConfig(values);
        }
      });
    });
  }, [form]);

  const { open = true, functions } = appSetting?.beta || {};

  return (
    <div className={styles.settingPage}>
      <div className={styles.pageTitle}>{intl.get('setting.globalSetting')}</div>
      <div className={styles.pageContent}>
        <Row className={styles.settingItem}>
          <Col className={styles.title} style={{ alignItems: 'center' }}>
            {intl.get('common.language')}
          </Col>
          <Col>
            <LanguageSelect />
          </Col>
        </Row>
        <Row className={styles.settingItem}>
          <Col className={styles.title} style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ marginBottom: '20px' }}>{intl.get('setting.betaFunction')}</span>
            <div>
              <Switch
                checked={open}
                style={{ width: '72px' }}
                onChange={(checked) => updateAppSetting({ open: checked })}
              />
            </div>
          </Col>
          <Col>
            <div className={styles.betaFunItem}>
              <Switch
                style={{ width: '64px' }}
                checked={functions?.viewSchema?.open !== false}
                onChange={(open) => updateAppSetting({ functions: { ...functions, viewSchema: { open } } })}
              />
              <div className={styles.itemContent}>
                <div className={styles.betaFunName}>{intl.get('common.viewSchema')}</div>
                <div className={styles.tips}>{intl.get('setting.viewScmemaBetaFunDesc')}</div>
              </div>
            </div>
            <div className={styles.betaFunItem}>
              <Switch
                style={{ width: '64px' }}
                checked={functions?.text2query?.open !== false}
                onChange={(open) => updateAppSetting({ functions: { ...functions, text2query: { open } } })}
              />
              <div className={styles.itemContent}>
                <div className={styles.betaFunName}>{intl.get('setting.text2query')}</div>
                <div className={styles.tips}>{intl.get('setting.text2queryDesc')}</div>
              </div>
            </div>
            <div className={styles.betaFunItem}>
              <Switch
                style={{ width: '64px' }}
                checked={functions?.llmImport?.open !== false}
                onChange={(open) => updateAppSetting({ functions: { ...functions, llmImport: { open } } })}
              />
              <div className={styles.itemContent}>
                <div className={styles.betaFunName}>{intl.get('setting.llmImport')}</div>
                <div className={styles.tips}>{intl.get('setting.llmImportDesc')}</div>
                <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                  <Form.Item label="API type" name="apiType" required={true}>
                    <Select
                      onChange={(value) => {
                        setApiType(value);
                      }}
                      defaultValue="openai"
                      style={{ width: 120 }}
                    >
                      <Select.Option value="openai">OpenAI</Select.Option>
                      <Select.Option value="qwen">Aliyun</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="URL" name="url" required={true}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="key" name="key">
                    <Input type="password" />
                  </Form.Item>
                  {apiType === 'qwen' && (
                    <Form.Item label="model" name="model" required={true}>
                      <Input placeholder="qwen-max" />
                    </Form.Item>
                  )}
                  <Form.Item label={intl.get('setting.maxTextLength')} name="maxContextLength" required={true}>
                    <InputNumber min={0} />
                  </Form.Item>
                  <Form.Item label="" required={true}>
                    <Button onClick={onSubmitLLMForm} type="primary">
                      {intl.get('setting.verify')}
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
});
export default Setting;
