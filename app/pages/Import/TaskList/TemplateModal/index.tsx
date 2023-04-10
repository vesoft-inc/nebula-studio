/* eslint-disable no-template-curly-in-string */
import { Button, Form, Input, Modal, Spin, Upload, message } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const { intl, currentLocale } = useI18n();
  const { dataImport: { importTask }, files: { getFiles, fileList } } = useStore();
  const files = useMemo(() => fileList.map(item => item.name), [fileList]);
  useEffect(() => {
    getFiles();
  }, []);
  const emptyTextMap = useMemo(() => ({
    address: {
      text: '${YOUR_NEBULA_ADDRESS}',
      message: intl.get('import.addressRequired'),
    },
    user: {
      text: '${YOUR_NEBULA_NAME}',
      message: intl.get('import.usernameRequired'),
    },
    password: {
      text: '${YOUR_NEBULA_PASSWORD}',
      message: intl.get('import.passwordRequired'),
    },
    s3AccessKey: {
      text: '${YOUR_S3_ACCESS_KEY}',
      message: intl.get('import.s3AccessKeyRequired'),
    },
    s3SecretKey: {
      text: '${YOUR_S3_SECRET_KEY}',
      message: intl.get('import.s3SecretKeyRequired'),
    },
    sftpUsername: {
      text: '${YOUR_SFTP_USER}',
      message: intl.get('import.sftpUsernameRequired'),
    },
    sftpPassword: {
      text: '${YOUR_SFTP_PASSWORD}',
      message: intl.get('import.sftpPasswordRequired'),
    },
    ossAccessKey: {
      text: '${YOUR_OSS_ACCESS_KEY}',
      message: intl.get('import.ossAccessKeyRequired'),
    },
    ossSecretKey: {
      text: '${YOUR_OSS_SECRET_KEY}',
      message: intl.get('import.ossSecretKeyRequired'),
    },
  }), [currentLocale]);
  const validateEmpty = useCallback((key, value) => {
    if(!value || value === emptyTextMap[key].text) {
      return emptyTextMap[key].message;
    }
  }, []);

  const validateAddress = useCallback((client) => {
    const msg = validateEmpty('address', client.address);
    console.log('msg', msg);
    if(msg) return msg;
    const address = client.address.split(',');
    if(address.some(i => i.startsWith('http'))) {
      return intl.get('import.noHttp');
    }
    if (!address.includes(host)) {
      return intl.get('import.addressMatch');
    }
  }, [currentLocale]);

  const validateUser = useCallback((client) => {
    const msg = validateEmpty('user', client.user);
    if(msg) return msg;
    if (client.user !== username) {
      return intl.get('import.templateMatchError');
    }
  }, [currentLocale, username]);
  const validatePassword = useCallback((client) => validateEmpty('password', client.password), []);
  const validateS3 = useCallback((s3) => validateEmpty('s3AccessKey', s3.accessKey) || validateEmpty('s3SecretKey', s3.secretKey), []);
  const validateSftp = useCallback((sftp) => validateEmpty('sftpUsername', sftp.user) || validateEmpty('sftpPassword', sftp.password), []);
  const validateOSS = useCallback((oss) => validateEmpty('ossAccessKey', oss.accessKey) || validateEmpty('ossSecretKey', oss.secretKey), []);
  const validateClient = useCallback((content) => {
    const client = content.client || {};
    return validateAddress(client) || validateUser(client) || validatePassword(client);
  }, [validateAddress, validateUser, validatePassword]);
  const validateSources = useCallback((content) => {
    const sources = content.sources || [];
    let err;
    sources.some((file) => {
      if(file.path && !files.includes(file.path)) {
        err = intl.get('import.fileNotExist', { name: file.path });
        return !!err;
      }
      if(file.s3) {
        err = validateS3(file.s3);
        return !!err;
      }
      if(file.sftp) {
        err = validateSftp(file.sftp);
        return !!err;
      }
      if(file.oss) {
        err = validateOSS(file.oss);
        return !!err;
      }
    });
    return err;
  }, [validateS3, validateSftp, validateOSS, files]);

  const handleFileImport = async ({ file }) => {
    await setLoading(true);
    const content = await readFileContent(file);
    try {
      const parseContent = yaml.load(content);
      if(typeof parseContent === 'object') {
        let err;
        [validateClient, validateSources].some((strategy) => {
          err = strategy(parseContent);
          return !!err;
        });
        if(err) {
          throw new Error(err);
        }
        // empty props in yaml will converted to null, but its required in nebula-importer
        parseContent.sources.forEach(file => {
          if(file.edges) {
            file.edges.forEach(edge => {
              edge.props ||= [];
            });
          }
          if(file.tags) {
            file.tags.forEach(tag => {
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
      config: values.content, 
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
          <Link to="/import/datasources">{intl.get('import.uploadFile')}</Link>
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
