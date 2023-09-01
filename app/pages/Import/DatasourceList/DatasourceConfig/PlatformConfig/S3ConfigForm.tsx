import { useI18n } from '@vesoft-inc/i18n';
import { Input, Form, Select, FormInstance } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { ES3Platform } from '@app/interfaces/datasource';
import Instruction from '@app/components/Instruction';
import styles from './index.module.less';
import { useStore } from '@app/stores';
const FormItem = Form.Item;
interface IProps {
  formRef: FormInstance;
  mode: 'create' | 'edit';
  tempPwd: string;
}
const S3ConfigForm = (props: IProps) => {
  const { formRef, mode, tempPwd } = props;
  const { intl, currentLocale } = useI18n();
  const {
    moduleConfiguration: { dataImport },
  } = useStore();
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    if (mode === 'edit') {
      formRef.setFieldValue(['s3Config', 'accessSecret'], tempPwd);
    }
  }, [mode]);

  const handleUpdatePassword = () => {
    if (mode !== 'edit') return;
    if (!flag) {
      formRef.setFieldValue(['s3Config', 'accessSecret'], '');
      setFlag(true);
    }
  };
  const s3PlatformOptions = useMemo(() => {
    const options = [
      {
        label: 'AWS S3',
        value: ES3Platform.AWS,
      },
      {
        label: 'Aliyun OSS',
        value: ES3Platform.OSS,
      },
      {
        label: 'Tecent COS',
        value: ES3Platform.Tecent,
      },
      {
        label: intl.get('import.customize'),
        value: ES3Platform.Customize,
      },
    ];
    return options.filter((item) => dataImport.supportS3Platform.includes(item.value));
  }, [dataImport.supportS3Platform, currentLocale]);
  const handleReset = useCallback(() => {
    formRef.resetFields(['s3Config']);
  }, []);
  return (
    <FormItem noStyle>
      <FormItem
        name="platform"
        label={intl.get('import.s3Platform')}
        rules={[{ required: true, message: intl.get('formRules.platformRequired') }]}
      >
        <Select placeholder={intl.get('import.selectPlatform')} onChange={handleReset}>
          {s3PlatformOptions.map((item) => (
            <Select.Option key={item.value} value={item.value}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
      </FormItem>
      <FormItem noStyle shouldUpdate>
        {({ getFieldValue }) => {
          const platform = getFieldValue('platform');
          return (
            <>
              <FormItem
                name={['s3Config', 'region']}
                label={intl.get('import.region')}
                rules={[
                  platform === ES3Platform.AWS && { required: true, message: intl.get('formRules.regionRequired') },
                ]}
              >
                <Input placeholder={intl.get('import.enterRegion')} />
              </FormItem>
              <FormItem noStyle>
                <div className={styles.endpointFormItem}>
                  <FormItem
                    name={['s3Config', 'endpoint']}
                    label={intl.get('import.endpoint')}
                    rules={[{ required: true, message: intl.get('formRules.endpointRequired') }]}
                  >
                    <Input
                      placeholder={
                        platform === ES3Platform.AWS
                          ? 'https://s3.<region>.amazonaws.com'
                          : intl.get('import.enterAddress')
                      }
                    />
                  </FormItem>
                  {platform && (
                    <Instruction
                      description={intl.get('import.endpointTip', { sample: intl.get(`import.${platform}Tip`) })}
                    />
                  )}
                </div>
              </FormItem>
              <FormItem
                name={['s3Config', 'bucket']}
                label={intl.get('import.bucketName')}
                rules={[{ required: true, message: intl.get('formRules.bucketRequired') }]}
              >
                <Input placeholder={intl.get('import.bucketName')} />
              </FormItem>
              <FormItem
                name={['s3Config', 'accessKeyID']}
                label={intl.get('import.accessKeyId')}
                rules={[{ required: true, message: intl.get('formRules.accessKeyIdRequired') }]}
              >
                <Input placeholder={intl.get('import.accessKeyId')} />
              </FormItem>
              <FormItem
                name={['s3Config', 'accessSecret']}
                label={intl.get('import.accessKeySecret')}
                rules={[
                  platform !== ES3Platform.Customize && {
                    required: true,
                    message: intl.get('formRules.accessKeySecretRequired'),
                  },
                ]}
              >
                <Input
                  type="password"
                  placeholder={intl.get('import.accessKeySecret')}
                  onChange={handleUpdatePassword}
                />
              </FormItem>
            </>
          );
        }}
      </FormItem>
    </FormItem>
  );
};

export default observer(S3ConfigForm);
