import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { debounce } from 'lodash';
import { message } from 'antd';
import intl from 'react-intl-universal';
import FileList from './FileList';

const FileUpload = () => {
  const { files } = useStore();
  const { fileList, deleteFile, getFiles, uploadFile } = files;
  const [loading, setLoading] = useState(false);
  const transformFile = async (_file, fileList) => {
    fileList.forEach(file => {
      file.path = `${file.name}`;
      file.withHeader = false;
    });
    await handleUpdate(fileList);
    return false;
  };

  const handleUpdate = async (fileList: any) => {
    setLoading(true);
    await uploadFile(fileList).then(_ => {
      setTimeout(() => {
        getFileList();
        message.success(intl.get('import.uploadSuccessfully'));
      }, 2000);
    }).catch(_err => {
      setLoading(false);
    });
  };

  const handleDelete = async (index: number) => {
    const file = fileList[index].name;
    await deleteFile(file);
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
