import { useI18n } from '@vesoft-inc/i18n';
import { Input, Form, Select, FormInstance } from 'antd';
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './index.module.less';
const FormItem = Form.Item;
interface IProps {
  formRef: FormInstance;
  mode: 'create' | 'edit';
  tempPwd: string;
}
const S3ConfigForm = (props: IProps) => {
  const { formRef, mode, tempPwd } = props;
  const { intl } = useI18n();
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    if(mode === 'edit') {
      formRef.setFieldValue(['s3Config', 'accessSecret'], tempPwd);
      formRef.setFieldValue('platform', 'aws');
    }
  }, [mode]);

  const handleUpdatePassword = () => {
    if(mode !== 'edit') return;
    if(!flag) {
      formRef.setFieldValue(['s3Config', 'accessSecret'], '');
      setFlag(true);
    }
  };
  return (
    <FormItem noStyle>
      <FormItem label={intl.get('import.endpoint')} className={styles.mixedItem}>
        <FormItem name="platform" rules={[{ required: true, message: intl.get('formRules.platformRequired') } ]}>
          <Select placeholder={intl.get('import.selectPlatform')}>
            <Select.Option value="aws">AWS S3</Select.Option>
            <Select.Option value="aliyun">OSS</Select.Option>
          </Select>
        </FormItem>
        <FormItem name={['s3Config', 'region']} rules={[{ required: true, message: intl.get('formRules.regionRequired') } ]}>
          <Input placeholder={intl.get('import.enterRegion')} />
        </FormItem>
        <FormItem name={['s3Config', 'endpoint']} rules={[{ required: true, message: intl.get('formRules.endpointRequired') } ]}>
          <Input placeholder={intl.get('import.enterAddress')} />
        </FormItem>
      </FormItem>
      <FormItem name={['s3Config', 'bucket']} label={intl.get('import.bucketName')} rules={[{ required: true, message: intl.get('formRules.bucketRequired') } ]}>
        <Input placeholder={intl.get('import.bucketName')} />
      </FormItem>
      <FormItem name={['s3Config', 'accessKey']} label={intl.get('import.accessKeyId')} rules={[{ required: true, message: intl.get('formRules.accessKeyIdRequired') } ]}>
        <Input placeholder={intl.get('import.accessKeyId')} />
      </FormItem>
      <FormItem name={['s3Config', 'accessSecret']} label={intl.get('import.accessKeySecret')} rules={[{ required: true, message: intl.get('formRules.accessKeySecretRequired') } ]}>
        <Input type="password" placeholder={intl.get('import.accessKeySecret')} onChange={handleUpdatePassword} />
      </FormItem>
    </FormItem>
  );
};

export default observer(S3ConfigForm);
