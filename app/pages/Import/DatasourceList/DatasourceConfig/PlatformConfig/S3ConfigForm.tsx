import { useI18n } from '@vesoft-inc/i18n';
import { Input, Form, Select, FormInstance } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { IS3Platform } from '@app/interfaces/datasource';
import Instruction from '@app/components/Instruction';
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
    }
  }, [mode]);

  const handleUpdatePassword = () => {
    if(mode !== 'edit') return;
    if(!flag) {
      formRef.setFieldValue(['s3Config', 'accessSecret'], '');
      setFlag(true);
    }
  };

  const handleReset = useCallback(() => {
    formRef.resetFields(['s3Config']);
  }, []);
  return (
    <FormItem noStyle>
      <FormItem name="platform" label={intl.get('import.s3Platform')} rules={[{ required: true, message: intl.get('formRules.platformRequired') }]}>
        <Select placeholder={intl.get('import.selectPlatform')} onChange={handleReset}>
          <Select.Option value={IS3Platform.AWS}>AWS S3</Select.Option>
          <Select.Option value={IS3Platform.OSS}>Aliyun OSS</Select.Option>
          <Select.Option value={IS3Platform.Tecent}>Tecent COS</Select.Option>
          <Select.Option value={IS3Platform.Customize}>{intl.get('import.customize')}</Select.Option>
        </Select>
      </FormItem>
      <FormItem noStyle shouldUpdate>
        {({ getFieldValue }) => {
          const platform = getFieldValue('platform');
          return (
            <>
              <FormItem name={['s3Config', 'region']} label={intl.get('import.region')} rules={[platform === IS3Platform.AWS && { required: true, message: intl.get('formRules.regionRequired') } ]}>
                <Input placeholder={intl.get('import.enterRegion')} />
              </FormItem>
              <FormItem noStyle>
                <div className={styles.endpointFormItem}>
                  <FormItem name={['s3Config', 'endpoint']} label={intl.get('import.endpoint')} rules={[{ required: true, message: intl.get('formRules.endpointRequired') } ]}>
                    <Input placeholder={platform === IS3Platform.AWS ? 'https://s3.<region>.amazonaws.com' : intl.get('import.enterAddress')} />
                  </FormItem>
                  {platform && <Instruction description={intl.get('import.endpointTip', { sample: intl.get(`import.${platform}Tip`) })} />}
                </div>
              </FormItem>
              <FormItem name={['s3Config', 'bucket']} label={intl.get('import.bucketName')} rules={[{ required: true, message: intl.get('formRules.bucketRequired') } ]}>
                <Input placeholder={intl.get('import.bucketName')} />
              </FormItem>
              <FormItem name={['s3Config', 'accessKeyID']} label={intl.get('import.accessKeyId')} rules={[{ required: true, message: intl.get('formRules.accessKeyIdRequired') } ]}>
                <Input placeholder={intl.get('import.accessKeyId')} />
              </FormItem>
              <FormItem name={['s3Config', 'accessSecret']} label={intl.get('import.accessKeySecret')} rules={[platform !== IS3Platform.Customize && { required: true, message: intl.get('formRules.accessKeySecretRequired') } ]}>
                <Input type="password" placeholder={intl.get('import.accessKeySecret')} onChange={handleUpdatePassword} />
              </FormItem>
            </>
          );
        }}
      </FormItem>
    </FormItem>
  );
};

export default observer(S3ConfigForm);
