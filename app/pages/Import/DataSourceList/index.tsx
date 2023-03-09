import React from 'react';
import { observer } from 'mobx-react-lite';
import { Tabs, TabsProps } from 'antd';
import { useI18n } from '@vesoft-inc/i18n';
import { IRemoteType } from '@app/interfaces/import';
import LocalFileList from './LocalFileList';
import RemoteList from './RemoteList';
import styles from './index.module.less';

const DataSourceList = () => {
  const { intl } = useI18n();
  const items: TabsProps['items'] = [
    {
      key: 'local',
      label: intl.get('import.localFiles'),
      children: <LocalFileList />
    },
    {
      key: 'cloud',
      label: intl.get('import.cloudStorage'),
      children: <RemoteList type={IRemoteType.Cloud} />
    },
    {
      key: 'sftp',
      label: intl.get('import.sftp'),
      children: <RemoteList type={IRemoteType.Sftp} />
    },
  ];
  return (
    <div className={styles.dataSourceContainer}>
      <Tabs defaultActiveKey="local" items={items} className={styles.sourceTabs} />
    </div>
  );
};

export default observer(DataSourceList);
