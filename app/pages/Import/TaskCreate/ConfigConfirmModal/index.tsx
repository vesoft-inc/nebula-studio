import { useStore } from '@app/stores';
import { ITagItem, IEdgeItem } from '@app/stores/import';
import { useI18n } from '@vesoft-inc/i18n';
import { Button, Input, Modal } from 'antd';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import styles from './index.module.less';
interface IProps {
  visible: boolean;
  onConfirm: (password: string) => void
  onCancel: () => void;
  config?: { tagConfig: ITagItem[], edgeConfig: IEdgeItem[] }
}
const ConfigConfirmModal = (props: IProps) => {
  const { dataImport } = useStore();
  const [password, setPassword] = useState('');
  const { visible, onConfirm, onCancel, config } = props;
  const { intl } = useI18n();
  const handleConfirm = (password?: string) => {
    onConfirm(password);
    setPassword('');
  };
  const handleCancel = () => {
    setPassword('');
    onCancel();
  };
  const tagConfig = useMemo(() => config ? config.tagConfig : dataImport.tagConfig, [config]);
  const edgeConfig = useMemo(() => config ? config.edgeConfig : dataImport.edgeConfig, [config]);
  return (
    <Modal
      title={intl.get('import.importConfirm')}
      open={visible}
      onCancel={() => handleCancel()}
      destroyOnClose
      className={styles.importConfirmModal}
      footer={false}
    >
      <span className={styles.title}>{intl.get('import.configDisplay')}</span>
      <div className={styles.content}>
        {tagConfig.map((config) => config.files.map((item, index) => <div key={index}>- {intl.get('import.loadToTag', { file: item.file?.name, name: config.name })}</div>))}
        {edgeConfig.map((config) => config.files.map((item, index) => <div key={index}>- {intl.get('import.loadToEdge', { file: item.file?.name, name: config.name })}</div>))}
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
