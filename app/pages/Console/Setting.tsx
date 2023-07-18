import { Radio, Form, Input, Modal, Checkbox, InputNumber, Switch } from "antd";
import { useEffect } from "react";
import { post } from "@app/utils/http";
import gpt from "@app/stores/gpt";
import { observer } from "mobx-react-lite";
import { useI18n } from "@vesoft-inc/i18n";
import styles from "./index.module.less";

function Setting({ open, setVisible }) {
  const [form] = Form.useForm();
  const { intl } = useI18n();
  const onClose = () => {
    setVisible(false);
  };
  const onOk = async () => {
    const values = await form.validateFields();
    const { url, key, gptVersion, apiType, ...config } = values;
    const res = await post("/api/config/gpt")({
      url,
      key,
      gptVersion,
      apiType,
      config: JSON.stringify(config)
    });
    if (res.code === 0) {
      setVisible(false);
      gpt.setConfig(values);
    }
  };

  useEffect(() => {
    if (!open) return;
    initForm();
  }, [open]);

  async function initForm() {
    await gpt.fetchConfig();
    form.setFieldsValue(gpt.config);
  }
  return (
    <Modal
      title={intl.get("console.setting")}
      zIndex={1001}
      open={open}
      onOk={onOk}
      onCancel={onClose}
    >
      <Form
        form={form}
        className={styles.settingForm}
        layout='vertical'
      >
        <Form.Item>
          <div className={styles.switchWrapper}>
            <div>
              <Form.Item name="enableGPT2NGQLs" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <span>GPT2nGQL</span>
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

        <Form.Item
          name="url"
          tooltip={intl.get('console.gptAPITooltip')}
          required
          label="GPT API URL"
        >
          <Input />
        </Form.Item>
        <Form.Item name="key" required label="GPT API Key">
          <Input type="password" />
        </Form.Item>
        <Form.Item name="gptVersion" required label="GPT API Type">
          <Radio.Group>
            <Radio value="azure">azure</Radio>
            <Radio value="openai">openai</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="apiType" required label={intl.get("console.gptModelVersion")}>
          <Radio.Group>
            <Radio value="gpt3.5-turbo">gpt3.5-turbo</Radio>
            <Radio value="gpt4">gpt4</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="features" required label={intl.get("console.features")}>
          <Checkbox.Group >
            <Checkbox value="spaceSchema">{intl.get('console.useSpaceSchema')}</Checkbox>
            <Checkbox value="useConsoleNGQL">{intl.get('console.useConsoleNGQL')}</Checkbox>
          </Checkbox.Group>
        </Form.Item>
        <Form.Item name="docLength" required label={intl.get("console.docLength")}>
          <InputNumber />
        </Form.Item>
      </Form>
    </Modal>
  );
}
export default observer(Setting);