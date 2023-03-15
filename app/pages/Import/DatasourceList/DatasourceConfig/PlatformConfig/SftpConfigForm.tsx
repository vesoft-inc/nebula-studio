import { useI18n } from '@vesoft-inc/i18n';
import { Input, Form, FormInstance } from 'antd';
import React from 'react';
import { observer } from 'mobx-react-lite';

const FormItem = Form.Item;
interface IProps {
  formRef: FormInstance
}

const SftpConfigForm = (props: IProps) => {
  const { formRef } = props;
  const { intl } = useI18n();

  return (
    <FormItem noStyle>
      <FormItem name={['sftpConfig', 'host']} label={intl.get('import.serverAddress')} rules={[{ required: true, message: intl.get('formRules.formHostRequired') } ]}>
        <Input />
      </FormItem>
      <FormItem name={['sftpConfig', 'port']} label={intl.get('import.port')} rules={[{ required: true, message: intl.get('formRules.formPortRequired') } ]}>
        <Input type="number" />
      </FormItem>
      <FormItem name={['sftpConfig', 'username']}label={intl.get('configServer.username')} rules={[{ required: true, message: intl.get('formRules.usernameRequired') } ]}>
        <Input />
      </FormItem>
      <FormItem name={['sftpConfig', 'password']} label={intl.get('configServer.password')} rules={[{ required: true, message: intl.get('formRules.passwordRequired') } ]}>
        <Input type="password" />
      </FormItem>
    </FormItem>
  );
};

export default observer(SftpConfigForm);
