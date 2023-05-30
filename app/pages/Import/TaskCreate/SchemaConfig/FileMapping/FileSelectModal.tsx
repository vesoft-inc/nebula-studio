import { useI18n } from '@vesoft-inc/i18n';
import { Modal } from 'antd';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import FileConfigSetting from '@app/components/FileConfigSetting';
import { ICachedStore } from '@app/stores/datasource';
import FileSelect from './FileSelect';
import styles from './index.module.less';
interface IModalProps {
  visible: boolean;
  onConfirm: (file, cachedDatasourceState: ICachedStore) => void
  onCancel: () => void;
  cachedDatasourceState?: ICachedStore;
}
const FileSelectModal = (props: IModalProps) => {
  const { visible, onConfirm, onCancel, cachedDatasourceState } = props;
  const { intl } = useI18n();
  const [step, setStep] = useState(0);
  const [preUploadList, setPreUploadList] = useState([]);
  const [cachedState, setcachedState] = useState(cachedDatasourceState || undefined);
  const title = useMemo(() => {
    if(step === 0) {
      return intl.get('import.selectDatasourceFile');
    }
    return intl.get('import.preview');
  }, [step]);
  const handlePreview = useCallback((file, cachedState) => {
    setPreUploadList([file]);
    setcachedState(cachedState);
    setStep(1);
  }, []);
  const handleConfirm = useCallback((file) => {
    onConfirm(file[0], cachedState);
  }, [cachedState]);
  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      className={styles.selectFileModal}
      footer={false}
      width={step === 0 ? 700 : 920}
    >
      {step === 0 && <FileSelect onConfirm={handlePreview} cachedState={cachedState} />}
      {step === 1 && <FileConfigSetting 
        preUploadList={preUploadList}
        onConfirm={handleConfirm} 
        onCancel={() => setStep(0)} />}
    </Modal>
  );
};

export default observer(FileSelectModal);
