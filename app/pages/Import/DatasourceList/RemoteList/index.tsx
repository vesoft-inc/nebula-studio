import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import { trackPageView } from '@app/utils/stat';
import { Button, message, Popconfirm, Table } from 'antd';
import Icon from '@app/components/Icon';
import cls from 'classnames';
import { IDatasourceType } from '@app/interfaces/datasource';
import { useI18n } from '@vesoft-inc/i18n';

import dayjs from 'dayjs';
import DatasourceConfigModal from '../DatasourceConfig/PlatformConfig';
import styles from './index.module.less';

interface IProps {
  type: IDatasourceType;
}
const cloudKeys = [
  {
    title: 'ipAddress',
    key: ['s3Config', 'endpoint']
  },
  {
    title: 'bucketName',
    key: ['s3Config', 'bucket']
  },
  {
    title: 'accessKeyId',
    key: ['s3Config', 'accessKey']
  },
  {
    title: 'region',
    key: ['s3Config', 'region']
  },
  {
    title: 'createTime',
    key: 'createTime',
    render: data => data && dayjs(data).format('YYYY-MM-DD HH:mm:ss')
  },
];
const sftpKeys = [{
  title: 'ipAddress',
  key: ['sftpConfig', 'host'],
  render: (_, row) => `${row.sftpConfig.host}:${row.sftpConfig.port}`
},
{
  title: 'account',
  key: ['sftpConfig', 'username']
},
{
  title: 'createTime',
  key: 'createTime',
  render: data => data && dayjs(data).format('YYYY-MM-DD HH:mm:ss')
}
];
const columnKeys = {
  [IDatasourceType.s3]: cloudKeys,
  [IDatasourceType.sftp]: sftpKeys,
};

const DatasourceList = (props: IProps) => {
  const { type } = props;
  const { datasource } = useStore();
  const { intl } = useI18n();
  const { getDatasourceList, datasourceList, deleteDataSource, batchDeleteDatasource } = datasource;
  const [data, setData] = useState<any[]>([]);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectItems, setSelectItems] = useState<number[]>([]);

  const create = useCallback(() => {
    setEditData(null);
    setVisible(true);
  }, []);
  const editItem = useCallback((item) => {
    setEditData(item);
    setVisible(true);
  }, []);
  const deleteItem = useCallback(async id => {
    const flag = await deleteDataSource(id);
    flag && (getList(), message.success(intl.get('common.deleteSuccess')));
  }, []);  
  const columns = columnKeys[type].map(item => ({
    title: intl.get(`import.${item.title}`),
    dataIndex: item.key,
    render: item.render
  })).concat(({
    title: intl.get('common.operation'),
    key: 'operation',
    render: (_, item) => (<div className={styles.operation}>
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
    </div>)
  } as any));


  const getList = async () => {
    !loading && setLoading(true);
    const data = await getDatasourceList({ type });
    setData(data);
    setLoading(false);
  };
  const handleDeleteDatasource = useCallback(async () => {
    const flag = await batchDeleteDatasource(selectItems);
    if (!flag) return;
    message.success(intl.get('common.deleteSuccess'));
    getList();
    setSelectItems([]);
  }, [selectItems]);

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
          disabled={!selectItems.length}
        >
          <Button className={styles.deleteBtn} disabled={!selectItems.length}>
            {intl.get('import.deleteDataSource')}
          </Button>
        </Popconfirm>
      </div>
      <div className={styles.fileList}>
        <h3>{intl.get('import.datasourceList', { type: intl.get(`import.${type}`) })} ({datasourceList.length})</h3>
        <Table
          loading={!!loading}
          dataSource={data}
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys) => setSelectItems(selectedRowKeys as number[]),
          }}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </div>
      {visible && <DatasourceConfigModal data={editData} type={type} visible={visible} onCancel={() => setVisible(false)} onConfirm={handleRefresh} />}
    </div>
  );
};

export default observer(DatasourceList);
