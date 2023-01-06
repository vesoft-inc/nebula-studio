import { Button, Form, Input, Modal, Spin, Upload, message } from 'antd';
import React, { useEffect, useState } from 'react';
import Icon from '@app/components/Icon';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { readFileContent } from '@app/utils/file';
import yaml from 'js-yaml';
import json2yaml from 'json2yaml';
import { exampleJson } from '@app/utils/import';
import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';
const { Dragger } = Upload;
const { TextArea } = Input;

interface IProps {
  visible: boolean;
  username: string;
  host: string;
  onClose: () => void;
  onImport: () => void;
}

const TemplateModal = (props: IProps) => {
  const { visible, onClose, onImport, username, host } = props;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState('');
  const { intl } = useI18n();
  const { dataImport: { importTask }, files: { getFiles, fileList } } = useStore();
  useEffect(() => {
    getFiles();
  }, []);
  const handleFileImport = async ({ file }) => {
    await setLoading(true);
    const files = fileList.map(item => item.name);
    const content = await readFileContent(file);
    try {
      const parseContent = yaml.load(content);
      if(typeof parseContent === 'object') {
        const connection = parseContent.clientSettings?.connection || {};
        if(connection.address.startsWith('http')) {
          throw new Error(intl.get('import.noHttp'));
        }
        if(connection.address !== host) {
          throw new Error(intl.get('import.templateMatchError', { type: 'address' }));
        }
        if(connection.user !== username) {
          throw new Error(intl.get('import.templateMatchError', { type: 'username' }));
        }
        parseContent.files?.forEach(file => {
          if(!files.includes(file.path)) {
            throw new Error(intl.get('import.fileNotExist', { name: file.path }));
          }
        });
        // empty props in yaml will converted to null, but its required in nebula-importer
        parseContent.files.forEach(file => {
          if(file.schema.edge) {
            file.schema.edge.props ||= [];
          }
          if(file.schema.vertex) {
            file.schema.vertex?.tags.forEach(tag => {
              tag.props ||= [];
            });
          }
        });
        setConfig(JSON.stringify(parseContent, null, 2));
        form.setFieldsValue({
          name: `task-${Date.now()}`,
          content: JSON.stringify(parseContent, null, 2),
        });
      } else {
        return message.warning(intl.get('import.parseFailed'));
      }
    } catch (err: any) {
      if(typeof err === 'object' && err.name) {
        return message.warning(`${err.name}: ${err.message}`);
      } 
      return message.warning(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (values) => {
    const code = await importTask({
      config: JSON.parse(values.content), 
      name: values.name
    });
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
      open={visible}
      onCancel={onClose}
      className={styles.configImportModal}
      destroyOnClose={true}
      footer={false}
      title={intl.get('import.importYaml')}
    >
      {!config ? <Spin spinning={loading}>
        <p className={styles.tip}>
          {intl.get('import.fileUploadRequired')} 
          <Link to="/import/files">{intl.get('import.uploadFile')}</Link>
          {intl.get('import.fileUploadRequired2')} 
        </p>
        <p className={styles.tip}>
          {intl.get('import.exampleDownload')} 
          <Button type="link" className={styles.btnExampleDownload} onClick={handleTemplateDownload}>example.yaml</Button>
        </p>
        <p className={styles.tip}>
          {intl.get('import.uploadTemplateTip')} 
        </p>
        <Dragger className={styles.draggerTemplate} beforeUpload={() => false} onChange={handleFileImport} showUploadList={false} accept=".yaml, .yml">
          <div>
            <Icon className={styles.btnAddFile} type="icon-studio-btn-add" />
          </div>
          <div className={styles.dragTip}>
            <p className={styles.uploadText}>{intl.get('import.uploadTemplate')}</p>
            <p className={styles.uploadHint}>
              {intl.get('import.uploadBoxTip')}
            </p>
          </div>
        </Dragger>
      </Spin> : <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleImport}>
        <Form.Item label={intl.get('import.taskName')} name="name" rules={[{ required: true, message: intl.get('formRules.nameRequired') }]}>
          <Input />
        </Form.Item>
        <Form.Item label={intl.get('import.config')} name="content" rules={[{ required: true }]}>
          <TextArea className={styles.configArea} autoSize={true} disabled={true} />
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
