import { useI18n } from '@vesoft-inc/i18n';
import { message, Upload } from 'antd';
import React, { PropsWithChildren, useState } from 'react';
import { StudioFile } from '@app/interfaces/import';
import { useStore } from '@app/stores';
import { observer } from 'mobx-react-lite';
import { debounce } from 'lodash';
import { getFileSize } from '@app/utils/file';
import UploadConfigModal from '../LocalFileConfig';
type IUploadBtnProps = PropsWithChildren<{
  onUpload?: () => void
}>


const UploadBtn = (props: IUploadBtnProps) => {
  const { files, global } = useStore();
  const { children, onUpload } = props;
  const { intl } = useI18n();
  const [previewList, setPreviewList] = useState<StudioFile[]>([]);
  const { fileList } = files;
  const [visible, setVisible] = useState(false);
  const transformFile = async (_file: StudioFile, fileList: StudioFile[]) => {
    const size = fileList.reduce((acc, cur) => acc + cur.size, 0);
    if(global.gConfig?.maxBytes && size > global.gConfig.maxBytes) {
      message.error(intl.get('import.fileSizeLimit', { size: getFileSize(global.gConfig.maxBytes) }));
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
  const handleConfirm = () => {
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
      <UploadConfigModal visible={visible} uploadList={previewList} onConfirm={handleConfirm} onCancel={() => setVisible(false)} />
    </>
  );
};

export default observer(UploadBtn);
