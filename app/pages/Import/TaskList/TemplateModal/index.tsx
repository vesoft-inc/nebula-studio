import { Button, Form, Input, Modal, Spin, Upload, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import './index.less';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { readFileContent } from '@app/utils/file';
import yaml from 'js-yaml';
const { Dragger } = Upload;
const { TextArea } = Input;

interface IProps {
  visible: boolean;
  onClose: () => void;
  onImport: () => void;
}

const TemplateModal = (props: IProps) => {
  const { visible, onClose, onImport } = props;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState('');
  const { dataImport: { getTaskDir, taskDir, importTask }, files: { uploadDir, asyncGetUploadDir } } = useStore();
  useEffect(() => {
    if(!uploadDir) {
      asyncGetUploadDir();
    }
    getTaskDir();
  }, []);
  const handleFileImport = async ({ file }) => {
    await setLoading(true);
    const content = await readFileContent(file);
    const parseContent = yaml.load(content);
    if(typeof parseContent === 'object') {
      const _taskDir = taskDir.endsWith('/') ? taskDir : taskDir + '/';
      const _uploadDir = uploadDir.endsWith('/') ? uploadDir : uploadDir + '/';
      parseContent.logPath = _taskDir + parseContent.logPath;
      parseContent.files.forEach(file => {
        file.path = _uploadDir + file.path;
        file.failDataPath = _taskDir + `err/${file.failDataPath}`;
      });
      setConfig(JSON.stringify(parseContent, null, 2));
      form.setFieldsValue({
        content: JSON.stringify(parseContent, null, 2),
      });
    } else {
      return message.warning(intl.get('import.parseFailed'));
    }
    await setLoading(false);
  };

  const handleImport = async (values) => {
    const code = await importTask(JSON.parse(values.content), values.name);
    if(code === 0) {
      message.success(intl.get('import.startImporting'));
      onImport();
    }
    onClose();
  };
  return (
    <Modal
      width="50%"
      visible={visible}
      onCancel={onClose}
      className="config-import-modal"
      destroyOnClose={true}
      footer={false}
    >
      {!config ? <Spin spinning={loading}>
        <p className="tip">{intl.get('import.fileUploadRequired')}</p>
        <Dragger className="dragger-template" beforeUpload={() => false} onChange={handleFileImport} showUploadList={false} accept=".yaml, .yml">
          <div>
            <Icon className="btn-add-file" type="icon-studio-btn-add" />
          </div>
          <p className="ant-upload-text">{intl.get('import.uploadTemplate')}</p>
          <p className="ant-upload-hint">
            {intl.get('import.uploadTemplateTip')}
          </p>
        </Dragger>
      </Spin> : <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleImport}>
        <Form.Item noStyle={true}>
          <Button onClick={() => setConfig('')}>{intl.get('import.reUpload')}</Button>
          <Button type="primary" htmlType="submit">{intl.get('import.runImport')}</Button>
        </Form.Item>
        <Form.Item label={intl.get('import.taskName')} name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={intl.get('import.config')} name="content" rules={[{ required: true }]}>
          <TextArea autoSize={true} disabled={true} />
        </Form.Item>
      </Form>}
    </Modal>
  );
};

export default observer(TemplateModal);
