import { Radio, Select } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { Route, useHistory, useParams } from 'react-router-dom';
import intl from 'react-intl-universal';
import { trackPageView } from '@app/utils/stat';
import Breadcrumb from '@app/components/Breadcrumb';
import { observer } from 'mobx-react-lite';
import { useStore } from '@app/stores';
import Cookie from 'js-cookie';
import TagList from './List/Tag';
import EdgeList from './List/Edge';
import IndexList from './List/Index/index';
import SpaceStats from './List/SpaceStats';
import CommonCreate from './Create/CommonCreate';
import IndexCreate from './Create/IndexCreate';
import CommonEdit from './Edit/CommonEdit';
import './index.less';
const Option = Select.Option;

const SchemaConfig = () => {
  const history = useHistory();
  const [tab, setTab] = useState('tag');
  const { type, action } = useParams() as { type: string, action: string };
  const { schema } = useStore();
  const { spaces, getSpaces, switchSpace, currentSpace } = schema;
  const routes = useMemo(() => {
    if(action === 'list') {
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
    } else {
      return [
        {
          path: '/schema',
          breadcrumbName: intl.get('schema.spaceList'),
        },
        {
          path: `/schema/${type}/list`,
          breadcrumbName: intl.get('schema.configTypeList', { space: currentSpace, type: intl.get(`common.${type}`) }),
        },
        {
          path: '#',
          breadcrumbName: intl.get('schema.configTypeAction', { 
            action: intl.get(`common.${action}`), 
            type: intl.get(`common.${type}`) }),
        },
      ];
    }
  }, [currentSpace, action, Cookie.get('lang')]);
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
    history.push(`/schema/${type}/list`);
  };
  const handleTabChange = e => {
    setTab(e.target.value);
    history.push(`/schema/${e.target.value}/list`);
  };
  return (
    <div className="nebula-schema-page">
      <Breadcrumb routes={routes} extraNode={<div className="space-select">
        <span className="label">{intl.get('common.currentSpace')}</span>
        {action !== 'edit' ? <Select value={currentSpace} onChange={value => handleUpdateSpace(value)}>
          {spaces.map(space => (
            <Option value={space} key={space}>
              {space}
            </Option>
          ))}
        </Select> : <span>{currentSpace}</span>}
      </div>} />
      <div className="list-container center-layout">
        {action === 'list' && <div className="studio-tab-header">
          <Radio.Group
            className="nebula-tab-group"
            value={tab}
            buttonStyle="solid"
            onChange={handleTabChange}
          >
            <Radio.Button value="tag">{intl.get('common.tag')}</Radio.Button>
            <Radio.Button value="edge">{intl.get('common.edge')}</Radio.Button>
            <Radio.Button value="index">{intl.get('common.index')}</Radio.Button>
            <Radio.Button value="statistic">{intl.get('common.statistics')}</Radio.Button>
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
          <Route
            path={`/schema/tag/create`}
            exact={true}
            render={() => <CommonCreate createType="tag" />}
          />
          <Route
            path={`/schema/edge/create`}
            exact={true}
            render={() => <CommonCreate createType="edge" />}
          />
          <Route
            path={`/schema/tag/edit`}
            exact={true}
            render={() => <CommonEdit editType="tag" />}
          />
          <Route
            path={`/schema/edge/edit`}
            exact={true}
            render={() => <CommonEdit editType="edge" />}
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
