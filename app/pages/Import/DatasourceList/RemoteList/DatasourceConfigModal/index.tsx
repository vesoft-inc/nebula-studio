import { useI18n } from '@vesoft-inc/i18n';
import { Button, Modal, Form, Select, message } from 'antd';
import React, { useState } from 'react';
import { IRemoteType } from '@app/interfaces/datasource';
import { useStore } from '@app/stores';
import { observer } from 'mobx-react-lite';
import S3ConfigForm from './S3ConfigForm';
import SftpConfigForm from './SftpConfigForm';
import styles from './index.module.less';

const FormItem = Form.Item;
interface IProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  type?: IRemoteType;
  data?: any;
}

const fomrItemLayout = {
  labelCol: { span: 7, offset: 2 },
  wrapperCol: { span: 10 },
};

const DatasourceConfigModal = (props: IProps) => {
  const { visible, type, onCancel, onConfirm, data } = props;
  const { datasource } = useStore();
  const { addDataSource } = datasource;
  const { intl } = useI18n();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const submit = async (values: any) => {
    const { platform, ...rest } = values;
    setLoading(true);
    const flag = await addDataSource({
      type: values.type,
      name: '',
      ...rest
    });
    setLoading(false);
    flag && (message.success(intl.get('schema.createSuccess')), onConfirm());
  };
  console.log('data', data);
  
  return (
    <Modal
      title={intl.get('import.newDataSource')}
      open={visible}
      width={700}
      onCancel={onCancel}
      className={styles.dataSourceModal}
      footer={false}
    >
      <Form form={form} 
        className={styles.loginForm} requiredMark={false}
        layout="horizontal" {...fomrItemLayout} onFinish={submit} initialValues={{ ...data }}>
        {!type && <FormItem label={intl.get('import.dataSourceType')} name="type" initialValue={type || IRemoteType.S3}>
          <Select>
            <Select.Option value={IRemoteType.S3}>{intl.get('import.s3')}</Select.Option>
            <Select.Option value={IRemoteType.Sftp}>{intl.get('import.sftp')}</Select.Option>
            <Select.Option value="local">{intl.get('import.localFiles')}</Select.Option>
          </Select>
        </FormItem>}
        <FormItem noStyle shouldUpdate>
          {({ getFieldValue }) => {
            const configType = type || getFieldValue('type');
            switch (configType) {
              case IRemoteType.S3:
                return <S3ConfigForm formRef={form} />;
              case IRemoteType.Sftp:
                return <SftpConfigForm formRef={form} />;
              default:
                return null;
            }
          }}
        </FormItem>
        <div className={styles.btns}>
          <Button className={styles.btnSubmit} type="primary" htmlType="submit" loading={loading}>
            {intl.get('common.add')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default observer(DatasourceConfigModal);
