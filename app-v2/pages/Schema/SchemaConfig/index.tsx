import { Radio, Select } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { Route, useHistory, useParams } from 'react-router-dom';
import intl from 'react-intl-universal';
import { trackPageView } from '@appv2/utils/stat';
import Breadcrumb from '@appv2/components/Breadcrumb';
import TagList from './List/Tag';
import EdgeList from './List/Edge';
import IndexList from './List/Index/index';
import CommonCreate from './Create/CommonCreate';
import CommonEdit from './Edit/CommonEdit';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import Cookie from 'js-cookie';
import './index.less';
const Option = Select.Option;

const SchemaConfig = () => {
  const history = useHistory();
  const [tab, setTab] = useState('tag');
  const { space, type, action } = useParams() as {space :string, type: string, action: string };
  const { schema } = useStore();
  const { spaces, getSpaces, switchSpace } = schema;
  const routes = useMemo(() => {
    if(action === 'list') {
      return [
        {
          path: '/schema',
          breadcrumbName: intl.get('_schema.spaceList'),
        },
        {
          path: '#',
          breadcrumbName: space,
        },
      ];
    } else {
      return [
        {
          path: '/schema',
          breadcrumbName: intl.get('_schema.spaceList'),
        },
        {
          path: `/schema/${space}/${type}/list`,
          breadcrumbName: intl.get('_schema.configTypeList', { space, type: intl.get(`common.${type}`) }),
        },
        {
          path: '#',
          breadcrumbName: intl.get('_schema.configTypeAction', { 
            action: intl.get(`common.${action}`), 
            type: intl.get(`common.${type}`) }),
        },
      ];
    }
  }, [space, action, Cookie.get('lang')]);
  useEffect(() => {
    setTab(type);
    if(spaces.length === 0) {
      getSpaces();
    }
  }, []);
  useEffect(() => {
    trackPageView(space ? `/schema/config/${type}/list` : `/schema`);
  }, [space, type]);

  const handleUpdateSpace = (value: string) => {
    switchSpace(value);
    history.push(`/schema/${value}/${type}/list`);
  };
  const handleTabChange = e => {
    setTab(e.target.value);
    history.push(`/schema/${space}/${e.target.value}/list`);
  };
  return (
    <div className="nebula-schema-page">
      <Breadcrumb routes={routes} extraNode={<div className="space-select">
        <span className="label">{intl.get('common.currentSpace')}</span>
        {action !== 'edit' ? <Select value={space} onChange={value => handleUpdateSpace(value)}>
          {spaces.map(space => (
            <Option value={space} key={space}>
              {space}
            </Option>
          ))}
        </Select> : <span>{space}</span>}
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
            path={`/schema/:space/tag/list`}
            exact={true}
            component={TagList}
          />
          <Route
            path="/schema/:space/edge/list"
            exact={true}
            component={EdgeList}
          />
          <Route
            path="/schema/:space/index/list/:module?"
            exact={true}
            component={IndexList}
          />
          <Route
            path={`/schema/:space/tag/create`}
            exact={true}
            render={() => <CommonCreate createType="tag" />}
          />
          <Route
            path={`/schema/:space/edge/create`}
            exact={true}
            render={() => <CommonCreate createType="edge" />}
          />
          <Route
            path={`/schema/:space/tag/edit/:name?`}
            exact={true}
            render={() => <CommonEdit editType="tag" />}
          />
          <Route
            path={`/schema/:space/edge/edit/:name?`}
            exact={true}
            render={() => <CommonEdit editType="edge" />}
          />
          
          {/* <Route
            path={`/space/:space/index/create`}
            exact={true}
            component={CreateIndex}
          /> */}
        </>
      </div>
    </div>
  );
};

export default observer(SchemaConfig);
