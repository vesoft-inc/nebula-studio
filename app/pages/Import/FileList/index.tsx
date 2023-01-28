import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { debounce } from 'lodash';
import { Button, Checkbox, Popconfirm, Table, Upload, message } from 'antd';
import Icon from '@app/components/Icon';
import CSVPreviewLink from '@app/components/CSVPreviewLink';
import { getFileSize } from '@app/utils/file';
import cls from 'classnames';
import { StudioFile } from '@app/interfaces/import';
import { useI18n } from '@vesoft-inc/i18n';
import UploadConfigModal from './UploadConfigModal';

import styles from './index.module.less';

const FileList = () => {
  const { files, global } = useStore();
  const { intl } = useI18n();
  const { fileList, deleteFile, getFiles, uploadFile } = files;
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [previewList, setPreviewList] = useState<StudioFile[]>([]);
  const columns = [
    {
      title: intl.get('import.fileName'),
      dataIndex: 'name',
      width: '50%'
    },
    {
      title: intl.get('import.withHeader'),
      key: 'withHeader',
      render: () => <Checkbox disabled={true} />,
    },
    {
      title: intl.get('import.delimiter'),
      key: 'delimiter',
      render: () => <Checkbox disabled={true} />,
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
      render: (_, file, index) => {
        if(!file.content) {
          return null;
        }
        return (
          <div className={styles.operation}>
            <CSVPreviewLink file={file} btnType="default">
              <Icon type="icon-studio-btn-detail" />
            </CSVPreviewLink>
            <Popconfirm
              onConfirm={() => handleDelete(index)}
              title={intl.get('common.ask')}
              okText={intl.get('common.ok')}
              cancelText={intl.get('common.cancel')}
            >
              <Button className="warningBtn" type="link">
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
      // message.error(intl.get('import.fileSizeLimit', { size: getFileSize(global.gConfig.maxBytes) }));
      // return false;
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

  const handleUpdate = (fileList: StudioFile[]) => {
    uploadFile(fileList).then(res => {
      if(res.code === 0) {
        message.success(intl.get('import.uploadSuccessfully'));
        getFileList();
      } 
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
    <div className={styles.fileUpload}>
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

      <div className={styles.fileList}>
        <h3>{intl.get('import.fileTitle')} ({fileList.length})</h3>
        <Table
          loading={!!loading}
          dataSource={fileList}
          columns={columns}
          rowKey="name"
          pagination={false}
        />
      </div>
      <UploadConfigModal visible={visible} fileList={previewList} onConfirm={handleUpdate} onCancel={() => setVisible(false)} />
    </div>
  );
};

export default observer(FileList);
