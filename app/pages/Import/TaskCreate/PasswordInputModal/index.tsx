import { useI18n } from '@vesoft-inc/i18n';
import { Button, Input, Modal } from 'antd';
import React, { useState } from 'react';

import styles from './index.module.less';
interface IProps {
  visible: boolean;
  onConfirm: (password: string) => void
  onCancel: () => void
}
const PasswordInputModal = (props: IProps) => {
  const [password, setPassword] = useState('');
  const { visible, onConfirm, onCancel } = props;
  const { intl } = useI18n();
  const handleConfirm = (password?: string) => {
    onConfirm(password);
    setPassword('');
  };
  const handleCancel = () => {
    setPassword('');
    onCancel();
  };
  return (
    <Modal
      title={intl.get('import.enterPassword')}
      open={visible}
      onCancel={() => handleCancel()}
      className={styles.passwordModal}
      footer={false}
    >
      <Input.Password
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <div className={styles.btns}>
        <Button onClick={() => handleCancel()}>
          {intl.get('common.cancel')}
        </Button>
        <Button
          type="primary"
          disabled={!password}
          onClick={() => handleConfirm(password)}
        >
          {intl.get('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
};

export default PasswordInputModal;
