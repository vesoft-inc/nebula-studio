import { Button, Checkbox, Popconfirm, Table, Upload } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import CSVPreviewLink from '@app/components/CSVPreviewLink';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { getFileSize } from '@app/utils/file';
import { trackPageView } from '@app/utils/stat';
import cls from 'classnames';
import styles from './index.module.less';

const FileUpload = () => {
  const { files } = useStore();
  const { fileList, uploadDir, deleteFile, getFiles, uploadFile, getUploadDir } = files;
  const [loading, setLoading] = useState(false);
  const transformFile = async file => {
    file.path = `${uploadDir}/${file.name}`;
    file.withHeader = false;
    return file;
  };

  const handleUpdate = async (options: any) => {
    setLoading(true);
    const data = new FormData();
    data.append('file', options.file);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    await uploadFile({ data, config }).then(_ => {
      getFiles();
    });
    setLoading(false);
  };
  useEffect(() => {
    getFiles();
    getUploadDir();
    trackPageView('/import/files');
  }, []);
  const columns = [
    {
      title: intl.get('import.fileName'),
      dataIndex: 'name',
    },
    {
      title: intl.get('import.withHeader'),
      key: 'withHeader',
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
        if (file.content) {
          return (
            <div className={styles.operation}>
              <CSVPreviewLink file={file} btnType="default">
                <Icon type="icon-studio-btn-detail" />
              </CSVPreviewLink>
              <Popconfirm
                onConfirm={() => deleteFile(index)}
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
        }
      },
    },
  ];
  return (
    <div className={styles.fileUpload}>
      <Upload
        multiple={true}
        accept=".csv"
        showUploadList={false}
        fileList={fileList}
        method="PUT"
        headers={{
          'content-type': 'multipart/form-data',
        }}
        customRequest={handleUpdate}
        beforeUpload={transformFile as any}
      >
        <Button className={cls('studioAddBtn', styles.uploadBtn)} type="primary">
          <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />{intl.get('import.uploadFile')}
        </Button>
      </Upload>
      <div className={styles.fileList}>
        <h3>{intl.get('import.fileTitle')}</h3>
        <Table
          loading={!!loading}
          dataSource={fileList}
          columns={columns}
          rowKey="name"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default observer(FileUpload);
