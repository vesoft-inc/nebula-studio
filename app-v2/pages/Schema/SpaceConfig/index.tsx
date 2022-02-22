import { Radio, Select } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { Route, useHistory, useParams } from 'react-router-dom';
import intl from 'react-intl-universal';
import { trackPageView } from '@appv2/utils/stat';
import Breadcrumb from '@appv2/components/Breadcrumb';
import TagList from '../Tag';
import EdgeList from '../Edge';
import IndexList from '../Index/index';
import { observer } from 'mobx-react-lite';
import { useStore } from '@appv2/stores';
import './index.less';
const Option = Select.Option;

const SpaceConfig = () => {
  const history = useHistory();
  const [tab, setTab] = useState('tag');
  const { space, type } = useParams() as {space :string, type: string };
  const { schema } = useStore();
  const { spaces, getSpaces, switchSpace } = schema;
  const routes = useMemo(() => [
    {
      path: '/schema',
      breadcrumbName: intl.get('_schema.spaceList'),
    },
    {
      path: '#',
      breadcrumbName: space,
    },
  ], [space]);
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
        <Select value={space} onChange={value => handleUpdateSpace(value)}>
          {spaces.map(space => (
            <Option value={space} key={space}>
              {space}
            </Option>
          ))}
        </Select>
      </div>} />
      <div className="list-container center-layout">
        <div className="studio-tab-header">
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
        </div>
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
          {/* <Route
            path={`/space/:space/tag/create`}
            exact={true}
            component={CreateTag}
          />
          <Route
            path={`/space/:space/tag/edit/:tag?`}
            exact={true}
            render={props => (
              <EditTag
                asyncUpdateEditStatus={this.asyncUpdateEditStatus}
                {...props}
              />
            )}
          />
          
          <Route
            path={`/space/:space/edge/create`}
            exact={true}
            component={CreateEdge}
          />
          <Route
            path={`/space/:space/edge/edit/:edge?`}
            exact={true}
            render={props => (
              <EditEdge
                asyncUpdateEditStatus={this.asyncUpdateEditStatus}
                {...props}
              />
            )}
          />
          
          <Route
            path={`/space/:space/index/create`}
            exact={true}
            component={CreateIndex}
          /> */}
        </>
      </div>
    </div>
  );
};

export default observer(SpaceConfig);
