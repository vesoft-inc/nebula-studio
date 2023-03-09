import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { Button, Popconfirm, Table } from 'antd';
import Icon from '@app/components/Icon';
import cls from 'classnames';
import { IRemoteType } from '@app/interfaces/import';
import { useI18n } from '@vesoft-inc/i18n';

import styles from './index.module.less';

interface IProps {
  type: IRemoteType;
}
const cloudKeys = ['ipAddress', 'bucketName', 'accessKeyId', 'region', 'addDate'];
const sftpKeys = ['ipAddress', 'account', 'addDate'];
const columnKeys = {
  [IRemoteType.Cloud]: cloudKeys,
  [IRemoteType.Sftp]: sftpKeys,
};
const FileList = (props: IProps) => {
  const { type } = props;
  const { files, global } = useStore();
  const { intl } = useI18n();
  const { fileList, deleteFile, getFiles } = files;
  const [loading, setLoading] = useState(false);
  const [selectItems, setSelectItems] = useState<string[]>([]);
  const columns = columnKeys[type].map(key => ({
    title: intl.get(`import.${key}`),
    dataIndex: key,
  })).concat(({
    title: intl.get('common.operation'),
    key: 'operation',
    render: (_, file) => (<div className={styles.operation}>
      <Button>
        <Icon type="icon-studio-btn-detail" />
      </Button>
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
    </div>)
  } as any));


  const getFileList = async () => {
    !loading && setLoading(true);
    await getFiles();
    setLoading(false);
  };
  const handleDeleteFiles = useCallback(async () => {
    const flag = await deleteFile(selectItems);
    flag && setSelectItems([]);
  }, [selectItems]);
  useEffect(() => {
    getFileList();
    trackPageView('/import/dataSources');
  }, []);
  return (
    <div className={styles.fileUpload}>
      <div className={styles.fileOperations}>
        <Button className={cls('studioAddBtn', styles.uploadBtn)} type="primary">
          <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />{intl.get('import.newDataSource')}
        </Button>
        <Popconfirm
          onConfirm={handleDeleteFiles}
          title={intl.get('common.ask')}
          okText={intl.get('common.confirm')}
          cancelText={intl.get('common.cancel')}
          disabled={!selectItems.length}
        >
          <Button className={styles.deleteBtn} disabled={!selectItems.length}>
            {intl.get('import.deleteDataSource')}
          </Button>
        </Popconfirm>
      </div>
      <div className={styles.fileList}>
        <h3>{intl.get('import.dataSourceList', { type: intl.get(`import.${type}`) })} ({fileList.length})</h3>
        <Table
          loading={!!loading}
          dataSource={fileList}
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys) => setSelectItems(selectedRowKeys as string[]),
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
