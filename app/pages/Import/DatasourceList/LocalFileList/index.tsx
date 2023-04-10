import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { Button, Popconfirm, Table } from 'antd';
import Icon from '@app/components/Icon';
import { getFileSize } from '@app/utils/file';
import cls from 'classnames';
import { useI18n } from '@vesoft-inc/i18n';
import UploadLocalBtn from '../DatasourceConfig/FileUploadBtn';
import PreviewFileModal from './PreviewFileModal';

import styles from './index.module.less';

const FileList = () => {
  const { files } = useStore();
  const { intl } = useI18n();
  const { fileList, deleteFile, getFiles } = files;
  const [loading, setLoading] = useState(false);
  const [selectFiles, setSelectFiles] = useState<string[]>([]);
  const columns = [
    {
      title: intl.get('import.fileName'),
      dataIndex: 'name',
      width: '50%'
    },
    {
      title: intl.get('import.withHeader'),
      dataIndex: 'withHeader',
      render: value => value ? intl.get('import.hasHeader') : intl.get('import.noHeader'),
    },
    {
      title: intl.get('import.delimiter'),
      dataIndex: 'delimiter',
    },
    {
      title: intl.get('import.fileSize'),
      key: 'size',
      dataIndex: 'size',
      render: size => getFileSize(size),
    },
    {
      title: intl.get('common.operation'),
      key: 'operation',
      render: (_, file) => {
        // sample could be '' if file is empty
        // eslint-disable-next-line eqeqeq
        if(file.sample == undefined) {
          return null;
        }
        return (
          <div className={styles.operation}>
            <PreviewFileModal file={file}>
              <Icon type="icon-studio-btn-detail" />
            </PreviewFileModal>
            <Popconfirm
              onConfirm={() => deleteFile([file.name])}
              title={intl.get('common.ask')}
              okText={intl.get('common.confirm')}
              cancelText={intl.get('common.cancel')}
            >
              <Button className="warningBtn">
                <Icon type="icon-studio-btn-delete" />
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  const getFileList = async () => {
    !loading && setLoading(true);
    await getFiles();
    setLoading(false);
  };
  const handleDeleteFiles = useCallback(async () => {
    const flag = await deleteFile(selectFiles);
    flag && setSelectFiles([]);
  }, [selectFiles]);
  useEffect(() => {
    getFileList();
    trackPageView('/import/datasources');
  }, []);
  return (
    <div className={styles.fileUpload}>
      <div className={styles.fileOperations}>
        <UploadLocalBtn onUpload={getFileList} >
          <Button className={cls('studioAddBtn', styles.uploadBtn)} type="primary">
            <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />{intl.get('import.uploadFile')}
          </Button>
        </UploadLocalBtn>
        <Popconfirm
          onConfirm={handleDeleteFiles}
          title={intl.get('common.ask')}
          okText={intl.get('common.confirm')}
          cancelText={intl.get('common.cancel')}
          disabled={!selectFiles.length}
        >
          <Button className={styles.deleteBtn} disabled={!selectFiles.length}>
            {intl.get('import.deleteFiles')}
          </Button>
        </Popconfirm>
      </div>
      <div className={styles.fileList}>
        <h3>{intl.get('import.fileTitle')} ({fileList.length})</h3>
        <Table
          loading={!!loading}
          dataSource={fileList}
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys) => setSelectFiles(selectedRowKeys as string[]),
          }}
          columns={columns}
          rowKey="name"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default observer(FileList);
