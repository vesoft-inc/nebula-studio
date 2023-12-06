import { useStore } from '@app/stores';
import { useI18n } from '@vesoft-inc/i18n';
import { Button, Form, Input, Modal, Radio, Select, message } from 'antd';
import { observer } from 'mobx-react-lite';
import Icon from '@app/components/Icon';
import { useEffect, useMemo, useState } from 'react';
import { llmImportPrompt } from '@app/stores/llm';
import { getByteLength } from '@app/utils/function';
import { post } from '@app/utils/http';
import styles from './index.module.less';

const Create = observer((props: { visible: boolean; onCancel: () => void }) => {
  const { llm, schema, files } = useStore();
  const { fileList } = files;
  const { intl } = useI18n();
  const [form] = Form.useForm();
  const [type, setType] = useState('file');
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File>(null);
  const [space, setSpace] = useState<string>(null);
  const [tokens, setTokens] = useState<number>(0);
  const valuse = useMemo(() => {
    return form.getFieldsValue();
  }, [step]);
  useEffect(() => {
    if (!props.visible) return;
    llm.fetchConfig(); // refetch for update config
    files.getFiles();
    setStep(0);
    form.resetFields();
    form.setFieldsValue({
      type: 'file',
      promptTemplate: llmImportPrompt,
    });
    setTokens(null);
  }, [props.visible]);

  const onNext = () => {
    form.validateFields().then(() => {
      setStep(1);
    });
  };

  useEffect(() => {
    (async () => {
      if (file && space) {
        const types = {
          csv: 0.9,
          json: 0.6,
          pdf: 0.05,
        };
        const subfix = file.name.split('.').pop();
        const type = types[subfix] || 0.5;
        const size = file.size;
        const schema = await llm.getSpaceSchema(space);
        const schemaBytesLength = getByteLength(schema);
        // full connection
        const tokensNum = ((((schemaBytesLength * size) / 2000) * llm.config.maxContextLength) / 2000) * type;
        setTokens(tokensNum);
      }
    })();
  }, [file, space]);

  const onConfirm = async () => {
    const values = form.getFieldsValue();
    const schema = await llm.getSpaceSchema(space);
    post('/api/llm/import/job')({
      type,
      ...values,
      spaceSchemaString: schema,
    }).then((res) => {
      if (res.code === 0) {
        message.success(intl.get('common.success'));
        props.onCancel();
      }
    });
  };

  return (
    <Modal onCancel={props.onCancel} width={545} footer={null} open={props.visible} title={intl.get('llm.aiImport')}>
      <div className={styles.tips}>
        <Icon type="icon-vesoft-book-open-page-variant" />
        {intl.get('llm.importTip')}
      </div>
      <div className={styles.step}>
        <div
          onClick={() => {
            setStep(0);
          }}
        >
          <Icon type="icon-vesoft-numeric-1-circle" />
          {intl.get('llm.setup')}
        </div>
        <span />
        <div>
          <Icon type="icon-vesoft-numeric-2-circle" />
          {intl.get('llm.confirm')}
        </div>
      </div>
      {tokens !== 0 && (
        <div className={styles.tokenNum}>
          <span style={{ fontSize: 10, transform: 'translate(0px,1px)' }}>🅣</span> prompt token: ~
          {Math.ceil(tokens / 10000)}w
        </div>
      )}
      <Form form={form} layout="vertical" style={{ display: step === 0 ? 'block' : 'none' }}>
        <Form.Item label={intl.get('llm.file')} required>
          {llm.config.features.includes('aiImportFilePath') && (
            <Form.Item noStyle name="type">
              <Radio.Group
                onChange={(e) => {
                  setType(e.target.value);
                  form.setFieldValue('file', undefined);
                }}
              >
                <Radio.Button value="file">{intl.get('llm.file')}</Radio.Button>
                <Radio.Button value="filePath">{intl.get('llm.filePath')}</Radio.Button>
              </Radio.Group>
            </Form.Item>
          )}

          {type === 'file' ? (
            <Form.Item noStyle name="file">
              <Select
                style={{ marginTop: 10 }}
                onChange={(_, option: any) => {
                  setFile(option?.data);
                }}
              >
                {fileList.map((item) => (
                  <Select.Option key={item.name} value={item.name} data={item}>
                    {item.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item noStyle name="file">
              <Input style={{ marginTop: 10 }} placeholder="./data/llm" />
            </Form.Item>
          )}
        </Form.Item>
        <Form.Item label={intl.get('llm.importGraphSpace')} name="space" required>
          <Select onChange={(v) => setSpace(v)}>
            {schema.spaces.map((item) => (
              <Select.Option key={item} value={item}>
                {item}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item required label={intl.get('llm.exportNGQLFilePath')}>
          <Input disabled value={llm.config.gqlPath} />
        </Form.Item>
        <Form.Item required={true} label={intl.get('llm.prompt')} name="promptTemplate">
          <Input.TextArea style={{ height: 200 }} />
        </Form.Item>
      </Form>

      <Form layout="vertical" style={{ display: step === 1 ? 'block' : 'none' }}>
        <Form.Item label={intl.get('llm.file')}>
          <span>{valuse.file}</span>
        </Form.Item>
        <Form.Item label={intl.get('llm.url')}>
          <Input disabled value={llm.config.url} />
        </Form.Item>
      </Form>
      <div className={styles.buttonArea}>
        <Button onClick={props.onCancel}>{intl.get('common.cancel')}</Button>
        {step === 1 && <Button onClick={() => setStep(0)}>{intl.get('llm.previous')}</Button>}
        {step === 0 && (
          <Button onClick={onNext} type="primary">
            {intl.get('llm.next')}
          </Button>
        )}
        {step === 1 && (
          <Button type="primary" onClick={onConfirm}>
            {intl.get('llm.start')}
          </Button>
        )}
      </div>
    </Modal>
  );
});
export default Create;
