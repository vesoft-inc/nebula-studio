import { useI18n } from '@vesoft-inc/i18n';
import { Button, Modal, Form, Select, message } from 'antd';
import React, { useState } from 'react';
import { IDatasourceType } from '@app/interfaces/datasource';
import { useStore } from '@app/stores';
import { observer } from 'mobx-react-lite';
import UploadLocalBtn from '../FileUploadBtn';
import S3ConfigForm from './S3ConfigForm';
import SftpConfigForm from './SftpConfigForm';
import styles from './index.module.less';

const FormItem = Form.Item;
interface IProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  type?: IDatasourceType;
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
        requiredMark={false}
        layout="horizontal" {...fomrItemLayout} onFinish={submit} initialValues={{ ...data }}>
        <FormItem noStyle shouldUpdate>
          {({ getFieldValue }) => {
            const configType = type || getFieldValue('type');
            if (configType !== IDatasourceType.s3) return;
            return <p className={styles.tip}>{intl.get('import.s3Tip')}</p>;
          }}
        </FormItem>
        {!type && <FormItem label={intl.get('import.dataSourceType')} name="type" initialValue={type || IDatasourceType.s3}>
          <Select>
            <Select.Option value={IDatasourceType.s3}>{intl.get('import.s3')}</Select.Option>
            <Select.Option value={IDatasourceType.sftp}>{intl.get('import.sftp')}</Select.Option>
            <Select.Option value={IDatasourceType.local}>{intl.get('import.localFiles')}</Select.Option>
          </Select>
        </FormItem>}
        <FormItem noStyle shouldUpdate>
          {({ getFieldValue }) => {
            const configType = type || getFieldValue('type');
            switch (configType) {
              case IDatasourceType.s3:
                return <S3ConfigForm formRef={form} />;
              case IDatasourceType.sftp:
                return <SftpConfigForm formRef={form} />;
              default:
                return null;
            }
          }}
        </FormItem>
        <FormItem noStyle shouldUpdate>
          {({ getFieldValue }) => {
            const configType = getFieldValue('type');
            if (configType === 'local') {
              return <div className={styles.btns}>
                <UploadLocalBtn onUpload={onCancel}>
                  <Button className={styles.btnSubmit} type="primary">
                    {intl.get('common.add')}
                  </Button>
                </UploadLocalBtn>
              </div>;
            } else {
              return <div className={styles.btns}>
                <Button className={styles.btnSubmit} type="primary" htmlType="submit" loading={loading}>
                  {intl.get('common.add')}
                </Button>
              </div>;
            }
          }}
        </FormItem>
      </Form>
    </Modal>
  );
};

export default observer(DatasourceConfigModal);
