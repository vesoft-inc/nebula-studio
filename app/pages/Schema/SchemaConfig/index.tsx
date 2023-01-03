import { Radio, Select } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { Route, useHistory, useParams } from 'react-router-dom';
import { useI18n } from '@vesoft-inc/i18n';
import { trackPageView } from '@app/utils/stat';
import Breadcrumb from '@app/components/Breadcrumb';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import cls from 'classnames';
import { ISchemaEnum } from '@app/interfaces/schema';
import TagList from './List/Tag';
import EdgeList from './List/Edge';
import IndexList from './List/Index/index';
import SpaceStats from './List/SpaceStats';
import SchemaVisualization from './List/SchemaVisualization';
import CommonCreate from './Create/CommonCreate';
import IndexCreate from './Create/IndexCreate';
import CommonEdit from './Edit/CommonEdit';
import styles from './index.module.less';
const Option = Select.Option;

const SchemaConfig = () => {
  const history = useHistory();
  const [tab, setTab] = useState('tag');
  const { intl } = useI18n();
  const { type, action } = useParams() as { type: string, action: string };
  const { schema, global } = useStore();
  const { spaces, getSpaces, switchSpace, currentSpace } = schema;
  const { currentLocale } = useI18n();
  const showViewSchemaBetaFunc = global.appSetting.beta.functions.viewSchema.open;
  const routes = useMemo(() => {
    if(action === 'list' || type === 'visualization') {
      return [
        {
          path: '/schema',
          breadcrumbName: intl.get('schema.spaceList'),
        },
        {
          path: '#',
          breadcrumbName: currentSpace,
        },
      ];
    }

    return [
      {
        path: '/schema',
        breadcrumbName: intl.get('schema.spaceList'),
      },
      {
        path: `/schema/${type}/list`,
        breadcrumbName: intl.get('schema.configTypeList', { type: intl.get(`common.${type}`) }),
      },
      {
        path: '#',
        breadcrumbName: intl.get('schema.configTypeAction', {
          action: intl.get(`common.${action}`),
          type: intl.get(`common.${type}`),
        }),
      },
    ];
  }, [currentSpace, action, currentLocale]);
  useEffect(() => {
    setTab(type);
    if(spaces.length === 0) {
      getSpaces();
    }
  }, []);
  useEffect(() => {
    trackPageView(currentSpace ? `/schema/config/${type}/list` : `/schema`);
  }, [currentSpace, type]);

  const handleUpdateSpace = (value: string) => {
    switchSpace(value);
    const route = type === 'visualization' ? `/schema/visualization` : `/schema/${type}/list`;
    history.push(route);
  };
  const handleTabChange = e => {
    const type = e.target.value;
    setTab(type);
    const route = type === 'visualization' ? `/schema/visualization` : `/schema/${type}/list`;
    history.push(route);
  };
  return (
    <div className={styles.schemaPage}>
      <Breadcrumb routes={routes} extraNode={<div className={styles.spaceSelect}>
        <span className={styles.label}>{intl.get('common.currentSpace')}</span>
        {action !== 'edit' ? <Select value={currentSpace} onChange={value => handleUpdateSpace(value)}>
          {spaces.map(space => (
            <Option value={space} key={space}>
              {space}
            </Option>
          ))}
        </Select> : <span>{currentSpace}</span>}
      </div>} />
      <div className={cls(styles.listContainer, 'studioCenterLayout')}>
        {(action === 'list' || type === 'visualization') && <div className="studioTabHeader">
          <Radio.Group
            className="studioTabGroup"
            value={tab}
            buttonStyle="solid"
            onChange={handleTabChange}
          >
            <Radio.Button value="tag">{intl.get('common.tag')}</Radio.Button>
            <Radio.Button value="edge">{intl.get('common.edge')}</Radio.Button>
            <Radio.Button value="index">{intl.get('common.index')}</Radio.Button>
            <Radio.Button value="statistic">{intl.get('common.statistics')}</Radio.Button>
            {showViewSchemaBetaFunc && (
              <Radio.Button value="visualization">
                {intl.get('common.viewSchema')}
                <span className={styles.betaLabel}>{intl.get('common.beta')}</span>
              </Radio.Button>
            )}
          </Radio.Group>
        </div>}
        <>
          <Route
            path={`/schema/tag/list`}
            exact={true}
            component={TagList}
          />
          <Route
            path="/schema/edge/list"
            exact={true}
            component={EdgeList}
          />
          <Route
            path="/schema/index/list/:module?"
            exact={true}
            component={IndexList}
          />
          <Route
            path="/schema/statistic/list"
            exact={true}
            component={SpaceStats}
          />
          {showViewSchemaBetaFunc && <Route path="/schema/visualization" exact={true} component={SchemaVisualization} />}
          <Route
            path={`/schema/tag/create`}
            exact={true}
            render={() => <CommonCreate createType={ISchemaEnum.Tag} />}
          />
          <Route
            path={`/schema/edge/create`}
            exact={true}
            render={() => <CommonCreate createType={ISchemaEnum.Edge} />}
          />
          <Route
            path={`/schema/tag/edit`}
            exact={true}
            render={() => <CommonEdit editType={ISchemaEnum.Tag} />}
          />
          <Route
            path={`/schema/edge/edit`}
            exact={true}
            render={() => <CommonEdit editType={ISchemaEnum.Edge} />}
          />
          
          <Route
            path={`/schema/index/create`}
            exact={true}
            component={IndexCreate}
          />
        </>
      </div>
    </div>
  );
};

export default observer(SchemaConfig);
