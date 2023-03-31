import { useI18n } from '@vesoft-inc/i18n';
import { message, Modal, Upload } from 'antd';
import React, { PropsWithChildren, useState } from 'react';
import { StudioFile } from '@app/interfaces/import';
import { useStore } from '@app/stores';
import { observer } from 'mobx-react-lite';
import { debounce } from 'lodash';
import { getFileSize } from '@app/utils/file';
import FileConfigSetting from '@app/components/FileConfigSetting';
import styles from './index.module.less';
type IUploadBtnProps = PropsWithChildren<{
  onUpload?: () => void
}>

const SizeLimit = 200 * 1024 * 1024;
const UploadBtn = (props: IUploadBtnProps) => {
  const { files } = useStore();
  const { children, onUpload } = props;
  const { intl } = useI18n();
  const [previewList, setPreviewList] = useState<StudioFile[]>([]);
  const { fileList, uploadFile } = files;
  const [visible, setVisible] = useState(false);
  const transformFile = async (_file: StudioFile, fileList: StudioFile[]) => {
    const size = fileList.reduce((acc, cur) => acc + cur.size, 0);
    if(size > SizeLimit) {
      message.error(intl.get('import.fileSizeLimit', { size: getFileSize(SizeLimit) }));
      return false;
    }
    fileList.forEach(file => {
      file.path = `${file.name}`;
      file.withHeader = false;
      file.delimiter = ',';
    });
    setPreviewList(fileList);
    setVisible(true);
    return false;
  };
  const handleConfirm = async (data) => {
    const res = await uploadFile(data);
    if (res.code !== 0) return;
    message.success(intl.get('import.uploadSuccessfully'));
    onUpload?.();
    setVisible(false);
  };
  return (
    <>
      <Upload
        multiple={true}
        accept=".csv"
        showUploadList={false}
        fileList={fileList}
        customRequest={() => {}}
        beforeUpload={debounce(transformFile)}
      >
        {children}
      </Upload>
      <Modal
        title={intl.get('import.previewFiles')}
        open={visible}
        destroyOnClose
        width={920}
        onCancel={() => setVisible(false)}
        className={styles.uploadModal}
        footer={false}
      >
        <FileConfigSetting 
          preUploadList={previewList} 
          onConfirm={handleConfirm} 
          duplicateCheckList={fileList}
          onCancel={() => setVisible(false)} />
      </Modal>
    </>
  );
};

export default observer(UploadBtn);
