import React from 'react';
import { observer } from 'mobx-react-lite';
import { Tabs, TabsProps } from 'antd';
import { useI18n } from '@vesoft-inc/i18n';
import { IDatasourceType } from '@app/interfaces/datasource';
import LocalFileList from './LocalFileList';
import RemoteList from './RemoteList';
import styles from './index.module.less';

const DatasourceList = () => {
  const { intl } = useI18n();
  const items: TabsProps['items'] = [
    {
      key: IDatasourceType.local,
      label: intl.get('import.localFiles'),
      children: <LocalFileList />
    },
    {
      key: IDatasourceType.s3,
      label: intl.get('import.s3'),
      children: <RemoteList type={IDatasourceType.s3} />
    },
    {
      key: IDatasourceType.sftp,
      label: intl.get('import.sftp'),
      children: <RemoteList type={IDatasourceType.sftp} />
    },
  ];
  return (
    <div className={styles.dataSourceContainer}>
      <Tabs defaultActiveKey={IDatasourceType.local} items={items} className={styles.sourceTabs} />
    </div>
  );
};

export default observer(DatasourceList);
