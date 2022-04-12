import { Button, Input, Modal } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';

import styles from './index.module.less';
interface IProps {
  visible: boolean;
  onConfirm: (password?: string) => void
}
const PasswordInputModal = (props: IProps) => {
  const [password, setPassword] = useState('');
  const { visible, onConfirm } = props;
  const handleConfirm = (password?: string) => {
    onConfirm(password);
    setPassword('');
  };
  return (
    <Modal
      title={intl.get('import.enterPassword')}
      visible={visible}
      onCancel={() => onConfirm()}
      className={styles.passwordModal}
      footer={false}
    >
      <Input.Password
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <div className={styles.btns}>
        <Button onClick={() => handleConfirm()}>
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
