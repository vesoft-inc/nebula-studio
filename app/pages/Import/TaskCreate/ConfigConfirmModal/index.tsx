import { useStore } from '@app/stores';
import { useI18n } from '@vesoft-inc/i18n';
import { Button, Input, Modal } from 'antd';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';

import styles from './index.module.less';
interface IProps {
  visible: boolean;
  onConfirm: (password: string) => void
  onCancel: () => void;
  needPwdConfirm?: boolean;
}
const ConfigConfirmModal = (props: IProps) => {
  const { dataImport: { tagConfig, edgesConfig } } = useStore();
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
      title={intl.get('import.importConfirm')}
      open={visible}
      onCancel={() => handleCancel()}
      className={styles.importConfirmModal}
      footer={false}
    >
      <span className={styles.title}>{intl.get('import.configDisplay')}</span>
      <div className={styles.content}>
        {tagConfig.map((config) => config.files.map((item, index) => <div key={index}>- {intl.get('import.loadToTag', { file: item.file?.name, name: config.name })}</div>))}
        {edgesConfig.map((config) => config.files.map((item, index) => <div key={index}>- {intl.get('import.loadToEdge', { file: item.file?.name, name: config.name })}</div>))}
      </div>
      <span className={styles.title}>{intl.get('import.enterPassword')}</span>
      <span className={styles.label}>{intl.get('configServer.password')}</span>
      <Input.Password
        style={{ width: '70%' }}
        value={password}
        placeholder={intl.get('configServer.password')}
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

export default observer(ConfigConfirmModal);
