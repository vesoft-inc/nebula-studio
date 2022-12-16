import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { debounce } from 'lodash';
import { message } from 'antd';
import { StudioFile } from '@app/interfaces/import';
import { useI18n } from '@vesoft-inc/i18n';
import { getFileSize } from '@app/utils/file';
import FileList from './FileList';

const FileUpload = () => {
  const { files, global } = useStore();
  const { intl } = useI18n();
  const { fileList, deleteFile, getFiles, uploadFile } = files;
  const [loading, setLoading] = useState(false);
  const transformFile = async (_file: StudioFile, fileList: StudioFile[]) => {
    const size = fileList.reduce((acc, cur) => acc + cur.size, 0);
    if(size > global.gConfig.maxBytes) {
      message.error(intl.get('import.fileSizeLimit', { size: getFileSize(global.gConfig.maxBytes) }));
      return false;
    }
    fileList.forEach(file => {
      file.path = `${file.name}`;
      file.withHeader = false;
    });
    await handleUpdate(fileList);
    return false;
  };

  const handleUpdate = (fileList: StudioFile[]) => {
    setLoading(true);
    uploadFile(fileList).then(res => {
      if(res.code === 0) {
        message.success(intl.get('import.uploadSuccessfully'));
        getFileList();
      } else {
        setLoading(false);
      }
    }).catch(_err => {
      setLoading(false);
    });
  };

  const handleDelete = (index: number) => {
    const file = fileList[index].name;
    deleteFile(file);
  };

  const getFileList = async () => {
    !loading && setLoading(true);
    await getFiles();
    setLoading(false);
  };
  useEffect(() => {
    getFileList();
    trackPageView('/import/files');
  }, []);
  return (
    <FileList 
      fileList={fileList}
      loading={loading}
      onDelete={handleDelete}
      onUpload={debounce(transformFile)} />
  );
};

export default observer(FileUpload);
