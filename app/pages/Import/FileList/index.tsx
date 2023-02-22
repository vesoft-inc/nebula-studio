import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { debounce } from 'lodash';
import { Button, Popconfirm, Table, Upload, message } from 'antd';
import Icon from '@app/components/Icon';
import { getFileSize } from '@app/utils/file';
import cls from 'classnames';
import { StudioFile } from '@app/interfaces/import';
import { useI18n } from '@vesoft-inc/i18n';
import UploadConfigModal from './UploadConfigModal';
import PreviewFileModal from './PreviewFileModal';

import styles from './index.module.less';

const FileList = () => {
  const { files, global } = useStore();
  const { intl } = useI18n();
  const { fileList, deleteFile, getFiles } = files;
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [previewList, setPreviewList] = useState<StudioFile[]>([]);
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
        if(!file.sample) {
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

  const handleRefresh = () => {
    getFileList();
    setVisible(false);
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
    <div className={styles.fileUpload}>
      <div className={styles.fileOperations}>
        <Upload
          multiple={true}
          accept=".csv"
          showUploadList={false}
          fileList={fileList}
          customRequest={() => {}}
          beforeUpload={debounce(transformFile)}
        >
          <Button className={cls('studioAddBtn', styles.uploadBtn)} type="primary">
            <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />{intl.get('import.uploadFile')}
          </Button>
        </Upload>
        <Popconfirm
          onConfirm={() => deleteFile(selectFiles)}
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
      <UploadConfigModal visible={visible} uploadList={previewList} onConfirm={handleRefresh} onCancel={() => setVisible(false)} />
    </div>
  );
};

export default observer(FileList);
