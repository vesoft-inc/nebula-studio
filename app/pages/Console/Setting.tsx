import { Radio, Form, Input, Modal, Checkbox, InputNumber, Switch } from 'antd';
import { useEffect } from 'react';
import { post } from '@app/utils/http';
import llm from '@app/stores/llm';
import { observer } from 'mobx-react-lite';
import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';

function Setting({ open, setVisible }) {
  const [form] = Form.useForm();
  const { intl } = useI18n();
  const onClose = () => {
    setVisible(false);
  };
  const onOk = async () => {
    const values = await form.validateFields();
    const { url, key, llmVersion, apiType, ...config } = values;
    const res = await post('/api/config/llm')({
      url,
      key,
      llmVersion,
      apiType,
      config: JSON.stringify(config),
    });
    if (res.code === 0) {
      setVisible(false);
      llm.setConfig(values);
    }
  };

  useEffect(() => {
    if (!open) return;
    initForm();
  }, [open]);

  async function initForm() {
    await llm.fetchConfig();
    form.setFieldsValue(llm.config);
  }
  return (
    <Modal title={intl.get('console.setting')} zIndex={1001} open={open} onOk={onOk} onCancel={onClose}>
      <Form form={form} className={styles.settingForm} layout="vertical">
        <Form.Item>
          <div className={styles.switchWrapper}>
            <div>
              <Form.Item name="enableLLM2NGQLs" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <span>LLM2nGQL</span>
              <span className={styles.beta}>BETA</span>
            </div>
            <div>
              <Form.Item name="enableCopilot" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <span>Copilot</span>
              <span className={styles.beta}>BETA</span>
            </div>
          </div>
        </Form.Item>

        <Form.Item name="url" tooltip={intl.get('console.llmAPITooltip')} required label="LLM API URL">
          <Input />
        </Form.Item>
        <Form.Item name="key" rules={[{ required: true }]} required label="LLM API Key">
          <Input type="password" />
        </Form.Item>
        <Form.Item name="llmVersion" required label="LLM API Type">
          <Radio.Group>
            <Radio value="azure">azure</Radio>
            <Radio value="openai">openai</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="apiType" required label={intl.get('console.llmModelVersion')}>
          <Radio.Group>
            <Radio value="llm3.5-turbo">llm3.5-turbo</Radio>
            <Radio value="llm4">llm4</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="features" required label={intl.get('console.features')}>
          <Checkbox.Group>
            <Checkbox value="spaceSchema">{intl.get('console.useSpaceSchema')}</Checkbox>
            <Checkbox value="useConsoleNGQL">{intl.get('console.useConsoleNGQL')}</Checkbox>
          </Checkbox.Group>
        </Form.Item>
        <Form.Item name="docLength" required label={intl.get('console.docLength')}>
          <InputNumber />
        </Form.Item>
      </Form>
    </Modal>
  );
}
export default observer(Setting);
