import { Radio, RadioChangeEvent } from 'antd';
import { useEffect, useState } from 'react';
import { Route, useHistory, useLocation } from 'react-router-dom';
import { trackPageView } from '@app/utils/stat';
import cls from 'classnames';
import { useI18n } from '@vesoft-inc/i18n';
import llm from '@app/stores/llm';
import { useStore } from '@app/stores';
import DatasourceList from './DatasourceList';
import styles from './index.module.less';
import TaskList from './TaskList';

const Import = () => {
  const history = useHistory();
  const location = useLocation();
  const [tab, setTab] = useState('tasks');
  const { intl } = useI18n();
  const { global: { platform }} = useStore();
  useEffect(() => {
    trackPageView('/import');
    if (platform !== 'cloud') {
      llm.fetchConfig();
    }
  }, []);
  useEffect(() => {
    const path = location.pathname;
    setTab(path.includes('datasources') ? 'datasources' : 'tasks');
  }, [location.pathname]);
  const handleTabChange = (e: RadioChangeEvent) => {
    setTab(e.target.value);
    history.push(`/import/${e.target.value}`);
  };
  return (
    <div className={cls(styles.nebuaImportPage, 'studioCenterLayout')}>
      <div className="studioTabHeader">
        <Radio.Group className="studioTabGroup" value={tab} buttonStyle="solid" onChange={handleTabChange}>
          <Radio.Button value="tasks">{intl.get('import.importData')}</Radio.Button>
          <Radio.Button value="datasources">{intl.get('import.dataSourceManagement')}</Radio.Button>
        </Radio.Group>
      </div>
      <div>
        <Route path={`/import/datasources`} exact={true} component={DatasourceList} />

        <Route path={`/import/tasks`} exact={true} component={TaskList} />
      </div>
    </div>
  );
};

export default Import;
