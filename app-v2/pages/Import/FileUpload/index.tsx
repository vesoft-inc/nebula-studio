import { Button, Checkbox, Popconfirm, Table, Upload } from 'antd';
import _ from 'lodash';
import React, { useEffect } from 'react';
import intl from 'react-intl-universal';

import CSVPreviewLink from '@appv2/components/CSVPreviewLink';
import { observer } from 'mobx-react-lite';

import { useStore } from '@appv2/stores';
import { getFileSize } from '@appv2/utils/file';
import { trackPageView } from '@appv2/utils/stat';

import './index.less';

const FileUpload = () => {
  const { files } = useStore();
  const { fileList, uploadDir, asyncDeleteFile, asyncGetFiles, asyncUploadFile, asyncGetUploadDir } = files;
  const transformFile = async file => {
    file.path = `${uploadDir}/${file.name}`;
    file.withHeader = false;
    return file;
  };

  const handleUpdate = async (options: any) => {
    const data = new FormData();
    data.append('file', options.file);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    await asyncUploadFile({ data, config }).then(_ => {
      asyncGetFiles();
    });
  };
  useEffect(() => {
    asyncGetFiles();
    asyncGetUploadDir();
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
      render: (_1, file, index) => {
        if (file.content) {
          return (
            <div className="operation">
              <div>
                <CSVPreviewLink file={file}>
                  {intl.get('import.preview')}
                </CSVPreviewLink>
                <Popconfirm
                  onConfirm={() => asyncDeleteFile(index)}
                  title={intl.get('common.ask')}
                  okText={intl.get('common.ok')}
                  cancelText={intl.get('common.cancel')}
                >
                  <Button type="link">{intl.get('common.delete')}</Button>
                </Popconfirm>
              </div>
            </div>
          );
        }
      },
    },
  ];
  return (
    <div className="nebula-file-upload">
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
        <Button className="upload-btn" type="default">
          {intl.get('import.uploadFile')}
        </Button>
      </Upload>
      <div className="file-list">
        <h3>{intl.get('import.fileTitle')}</h3>
        <Table
          // loading={!!loading}
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
