import { observer } from 'mobx-react-lite';
import { Tabs, TabsProps } from 'antd';
import { useI18n } from '@vesoft-inc/i18n';
import { IDatasourceType } from '@app/interfaces/datasource';
import LocalFileList from './LocalFileList';
import RemoteList from './RemoteList';
import styles from './index.module.less';
import { useStore } from '@app/stores';

const DatasourceList = () => {
  const { intl } = useI18n();
  const { moduleConfiguration } = useStore();
  const { dataImport } = moduleConfiguration;
  const items: TabsProps['items'] = [
    {
      key: IDatasourceType.Local,
      label: intl.get('import.localFiles'),
      children: <LocalFileList />,
    },
    {
      key: IDatasourceType.S3,
      label: intl.get('import.s3'),
      children: <RemoteList type={IDatasourceType.S3} />,
    },
    {
      key: IDatasourceType.SFTP,
      label: intl.get('import.sftp'),
      children: <RemoteList type={IDatasourceType.SFTP} />,
    },
  ].filter((item) => dataImport.supportDatasourceType.includes(item.key));
  return (
    <div className={styles.dataSourceContainer}>
      <Tabs defaultActiveKey={IDatasourceType.Local} items={items} className={styles.sourceTabs} />
    </div>
  );
};

export default observer(DatasourceList);
