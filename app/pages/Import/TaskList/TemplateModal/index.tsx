import { Button, Form, Input, Modal, Spin, Upload, message } from 'antd';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import { Link } from 'react-router-dom';
import './index.less';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { readFileContent } from '@app/utils/file';
import yaml from 'js-yaml';
import json2yaml from 'json2yaml';
import { exampleJson } from '@app/utils/import';
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
  const { dataImport: { getTaskDir, taskDir, importTask }, files: { uploadDir, getUploadDir, getFiles, fileList } } = useStore();
  useEffect(() => {
    if(!uploadDir) {
      getUploadDir();
    }
    getTaskDir();
    getFiles();
  }, []);
  const handleFileImport = async ({ file }) => {
    await setLoading(true);
    const files = fileList.map(item => item.name);
    const content = await readFileContent(file);
    const parseContent = yaml.load(content);
    try {
      if(typeof parseContent === 'object') {
        const _taskDir = taskDir.endsWith('/') ? taskDir : taskDir + '/';
        const _uploadDir = uploadDir.endsWith('/') ? uploadDir : uploadDir + '/';
        parseContent.logPath = `${_taskDir}import.log`;
        parseContent.files?.forEach(file => {
          if(!files.includes(file.path)) {
            message.error(intl.get('import.fileNotExist', { name: file.path }));
            throw new Error();
          }
          file.path = _uploadDir + file.path;
          file.failDataPath = _taskDir + `err/${file.failDataPath || 'err.log'}`;
        });
        setConfig(JSON.stringify(parseContent, null, 2));
        const count = taskDir.split('/').pop();
        form.setFieldsValue({
          name: `task-${count}`,
          content: JSON.stringify(parseContent, null, 2),
        });
      } else {
        return message.warning(intl.get('import.parseFailed'));
      }
    } catch (err) {
      console.log('err', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (values) => {
    const code = await importTask(JSON.parse(values.content), values.name);
    if(code === 0) {
      message.success(intl.get('import.startImporting'));
      onImport();
    }
    onClose();
  };

  const handleTemplateDownload = () => {
    const ymlStr = '### Please refer to the repo (https://github.com/vesoft-inc/nebula-importer) for configuration details' + json2yaml.stringify(exampleJson);
    const blob = new Blob([ymlStr]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `template.yaml`;
    link.click();
  };
  return (
    <Modal
      width="820px"
      visible={visible}
      onCancel={onClose}
      className="config-import-modal"
      destroyOnClose={true}
      footer={false}
      title={intl.get('import.importYaml')}
    >
      {!config ? <Spin spinning={loading}>
        <p className="tip">
          {intl.get('import.fileUploadRequired')} 
          <Link to="/import/files">{intl.get('import.uploadFile')}</Link>
          {intl.get('import.fileUploadRequired2')} 
        </p>
        <p className="tip">
          {intl.get('import.exampleDownload')} 
          <Button type="link" className="btn-example-download" onClick={handleTemplateDownload}>example.yaml</Button>
        </p>
        <p className="tip">
          {intl.get('import.uploadTemplateTip')} 
        </p>
        <Dragger className="dragger-template" beforeUpload={() => false} onChange={handleFileImport} showUploadList={false} accept=".yaml, .yml">
          <div>
            <Icon className="btn-add-file" type="icon-studio-btn-add" />
          </div>
          <div className="drag-tip">
            <p className="ant-upload-text">{intl.get('import.uploadTemplate')}</p>
            <p className="ant-upload-hint">
              {intl.get('import.uploadBoxTip')}
            </p>
          </div>
        </Dragger>
      </Spin> : <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleImport}>
        <Form.Item label={intl.get('import.taskName')} name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={intl.get('import.config')} name="content" rules={[{ required: true }]}>
          <TextArea className="config-area" autoSize={true} disabled={true} />
        </Form.Item>
        <Form.Item noStyle>
          <Button onClick={() => setConfig('')}>{intl.get('import.reUpload')}</Button>
          <Button type="primary" htmlType="submit">{intl.get('import.runImport')}</Button>
        </Form.Item>
      </Form>}
    </Modal>
  );
};

export default observer(TemplateModal);
