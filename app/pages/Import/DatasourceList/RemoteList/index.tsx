import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { Button, message, Popconfirm, Table, TableColumnType } from 'antd';
import Icon from '@app/components/Icon';
import cls from 'classnames';
import { IDatasourceType, IDatasourceItem } from '@app/interfaces/datasource';
import { Translation, useI18n } from '@vesoft-inc/i18n';

import dayjs from 'dayjs';
import DatasourceConfigModal from '../DatasourceConfig/PlatformConfig';
import styles from './index.module.less';

interface IProps {
  type: IDatasourceType;
}
const s3Columns: TableColumnType<IDatasourceItem>[] = [
  {
    title: <Translation>{(i) => i.get('import.ipAddress')}</Translation>,
    dataIndex: ['s3Config', 'endpoint'],
  },
  {
    title: <Translation>{(i) => i.get('import.bucketName')}</Translation>,
    dataIndex: ['s3Config', 'bucket'],
  },
  {
    title: <Translation>{(i) => i.get('import.accessKeyId')}</Translation>,
    dataIndex: ['s3Config', 'accessKeyID'],
  },
  {
    title: <Translation>{(i) => i.get('import.region')}</Translation>,
    dataIndex: ['s3Config', 'region'],
  },
  {
    title: <Translation>{(i) => i.get('import.createTime')}</Translation>,
    dataIndex: 'createTime',
    render: (data) => data && dayjs(data).format('YYYY-MM-DD HH:mm:ss'),
  },
];

const sftpColumns: TableColumnType<IDatasourceItem>[] = [
  {
    title: <Translation>{(i) => i.get('import.ipAddress')}</Translation>,
    dataIndex: ['sftpConfig', 'host'],
    render: (_, row) => `${row.sftpConfig.host}:${row.sftpConfig.port}`,
  },
  {
    title: <Translation>{(i) => i.get('import.account')}</Translation>,
    dataIndex: ['sftpConfig', 'username'],
  },
  {
    title: <Translation>{(i) => i.get('import.createTime')}</Translation>,
    dataIndex: 'createTime',
    render: (data) => data && dayjs(data).format('YYYY-MM-DD HH:mm:ss'),
  },
];

const DatasourceList = (props: IProps) => {
  const { type } = props;
  const { datasource } = useStore();
  const { intl, currentLocale } = useI18n();
  const { getDatasourceList, deleteDataSource, batchDeleteDatasource } = datasource;
  const [data, setData] = useState<IDatasourceItem[]>([]);
  const [editData, setEditData] = useState<IDatasourceItem>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectIds, setSelectIds] = useState<number[]>([]);
  const modalKey = useMemo(() => visible ? Math.random() : undefined, [visible]);
  const create = useCallback(() => {
    setEditData(null);
    setVisible(true);
  }, []);
  const editItem = useCallback((item: IDatasourceItem) => {
    setEditData(item);
    setVisible(true);
  }, []);
  const deleteItem = useCallback(async id => {
    const flag = await deleteDataSource(id);
    flag && (getList(), message.success(intl.get('common.deleteSuccess')));
  }, []);  
  const tableColumns: TableColumnType<IDatasourceItem>[] = useMemo(() => {
    const columns = type === IDatasourceType.S3 ? s3Columns : sftpColumns;
    return columns.concat({
      title: intl.get('common.operation'),
      key: 'operation',
      render: (_, item) => (
        <div className={styles.operation}>
          <Button className="primaryBtn" onClick={() => editItem(item)}>
            <Icon type="icon-studio-btn-detail" />
          </Button>
          <Popconfirm
            onConfirm={() => deleteItem(item.id)}
            title={intl.get('common.ask')}
            okText={intl.get('common.confirm')}
            cancelText={intl.get('common.cancel')}
          >
            <Button className="warningBtn">
              <Icon type="icon-studio-btn-delete" />
            </Button>
          </Popconfirm>
        </div>
      ),
    }); 
  }, [type, currentLocale]);


  const getList = async () => {
    !loading && setLoading(true);
    const data = await getDatasourceList({ type });
    setData(data);
    setLoading(false);
  };
  const handleDeleteDatasource = useCallback(async () => {
    const flag = await batchDeleteDatasource(selectIds);
    if (!flag) return;
    message.success(intl.get('common.deleteSuccess'));
    getList();
    setSelectIds([]);
  }, [selectIds]);

  const handleRefresh = () => {
    getList();
    setVisible(false);
  };

  useEffect(() => {
    getList();
    trackPageView('/import/datasources');
  }, []);
  return (
    <div className={styles.fileUpload}>
      <div className={styles.fileOperations}>
        <Button className={cls('studioAddBtn', styles.uploadBtn)} type="primary" onClick={create}>
          <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />{intl.get('import.newDataSource')}
        </Button>
        <Popconfirm
          onConfirm={handleDeleteDatasource}
          title={intl.get('common.ask')}
          okText={intl.get('common.confirm')}
          cancelText={intl.get('common.cancel')}
          disabled={!selectIds.length}
        >
          <Button className={styles.deleteBtn} disabled={!selectIds.length}>
            {intl.get('import.deleteDataSource')}
          </Button>
        </Popconfirm>
      </div>
      <div className={styles.fileList}>
        <h3>{intl.get('import.datasourceList', { type: intl.get(`import.${type}`) })} ({data.length})</h3>
        <Table
          loading={!!loading}
          dataSource={data}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectIds,
            onChange: (selectedRowKeys) => setSelectIds(selectedRowKeys as number[]),
          }}
          columns={tableColumns}
          rowKey="id"
          pagination={false}
        />
      </div>
      <DatasourceConfigModal key={modalKey} data={editData} type={type} visible={visible} onCancel={() => setVisible(false)} onConfirm={handleRefresh} />
    </div>
  );
};

export default observer(DatasourceList);
