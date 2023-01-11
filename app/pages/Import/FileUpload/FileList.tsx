import { Button, Checkbox, Popconfirm, Table, Upload } from 'antd';
import React from 'react';
import Icon from '@app/components/Icon';
import CSVPreviewLink from '@app/components/CSVPreviewLink';
import { getFileSize } from '@app/utils/file';
import cls from 'classnames';
import { StudioFile } from '@app/interfaces/import';
import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';
interface IProps {
  fileList: any[];
  onDelete: (index: number) => void;
  onUpload: (file: StudioFile, fileList: StudioFile[]) => void;
  loading: boolean;
}
const FileList = (props: IProps) => {
  const { onDelete, fileList, onUpload, loading } = props;
  const { intl } = useI18n();
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
              onConfirm={() => onDelete(index)}
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
  return (
    <div className={styles.fileUpload}>
      <Upload
        multiple={true}
        accept=".csv"
        showUploadList={false}
        fileList={fileList}
        customRequest={() => {}}
        beforeUpload={onUpload}
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
    </div>
  );
};

export default FileList;
