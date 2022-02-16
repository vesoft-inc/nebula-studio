import { Button, Divider, Modal, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps, match, withRouter } from 'react-router-dom';

import { LeftOutlined } from '@ant-design/icons';

import SpaceSearchInput from '../../Console/SpaceSearchInput';
import EdgeList from '../Edge';
import CreateEdge from '../Edge/Create';
import EditEdge from '../Edge/Edit';
import CreateIndex from '../Index/Create';
import IndexList from '../Index/index';
import TagList from '../Tag';
import CreateTag from '../Tag/Create';
import EditTag from '../Tag/Edit';
import { trackEvent } from '#app/utils/stat';
import { IDispatch, IRootState } from '#app/store';
import PrivateRoute from '#app/PrivateRoute';
import './index.less';

const TabPane = Tabs.TabPane;
const confirm = Modal.confirm;
const mapState = (state: IRootState) => ({
  loading: state.loading.effects.nebula.asyncGetSpacesList,
  currentSpace: state.nebula.currentSpace,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncSwitchSpace: async(space: string) => {
    await dispatch.nebula.asyncSwitchSpace(space);
    await dispatch.explore.clear();
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
  ReturnType<typeof mapDispatch>,
  RouteComponentProps {
  match: match<{
    type: string;
    action: string;
  }>;
}

interface IState {
  isEditing: boolean;
}
class SpaceConfig extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      isEditing: false,
    };
  }

  asyncUpdateEditStatus = (val: boolean) => {
    this.setState({ isEditing: val });
  };

  handleChangeTab = (key: string) => {
    const {
      params: { action },
    } = this.props.match;
    const { history } = this.props;
    if (action === 'create' || (action === 'edit' && this.state.isEditing)) {
      confirm({
        title: intl.get('schema.leavePage'),
        content: intl.get('schema.leavePagePrompt'),
        okText: intl.get('common.confirm'),
        cancelText: intl.get('common.cancel'),
        onOk() {
          history.push(`/space/${key}/list`);
          trackEvent('navigation', `view_${key}_list`, 'from_navigation');
        },
      });
    } else {
      history.push(`/space/${key}/list`);
      trackEvent('navigation', `view_${key}_list`, 'from_navigation');
    }
  };

  handleChangeSpace = async value => {
    await this.props.asyncSwitchSpace(value);
  };

  goBack = () => {
    const {
      params: { action },
    } = this.props.match;
    const { history } = this.props;
    const { isEditing } = this.state;
    if (action === 'create' || (action === 'edit' && isEditing)) {
      confirm({
        title: intl.get('schema.leavePage'),
        content: intl.get('schema.leavePagePrompt'),
        okText: intl.get('common.confirm'),
        cancelText: intl.get('common.cancel'),
        onOk() {
          history.push('/schema');
          trackEvent('navigation', 'view_schema', 'from_space_config_btn');
        },
      });
    } else {
      history.push('/schema');
      trackEvent('navigation', 'view_schema', 'from_space_config_btn');
    }
  };

  render() {
    const { currentSpace, match } = this.props;
    const {
      params: { type, action },
    } = match;
    return (
      <div className="nebula-space-config">
        <div className="header-space">
          <div>
            <span className="header-title space-title">
              {intl.get('common.currentSpace')}:{' '}
            </span>
            {action !== 'edit' ? (
              <SpaceSearchInput
                onSpaceChange={this.handleChangeSpace}
                value={currentSpace}
              />
            ) : (
              <span className="currentSpace">{currentSpace}</span>
            )}
          </div>
          <Button onClick={this.goBack}>
            <LeftOutlined />
            {intl.get('schema.backToSpaceList')}
          </Button>
        </div>
        <Divider />
        <div className="current-space-config">
          <Tabs
            className="config-tab"
            defaultActiveKey={type || 'tag'}
            activeKey={type}
            onChange={this.handleChangeTab}
            tabPosition="left"
          >
            <TabPane tab={intl.get('common.tag')} key="tag" />
            <TabPane tab={intl.get('common.edge')} key="edge" />
            <TabPane tab={intl.get('common.index')} key="index" />
          </Tabs>
          <div className="space-content">
            <PrivateRoute
              path={`/space/tag/list`}
              exact={true}
              component={TagList}
            />
            <PrivateRoute
              path={`/space/tag/create`}
              exact={true}
              component={CreateTag}
            />
            <PrivateRoute
              path={`/space/tag/edit`}
              exact={true}
              render={props => (
                <EditTag
                  asyncUpdateEditStatus={this.asyncUpdateEditStatus}
                  {...props}
                />
              )}
            />
            <PrivateRoute
              path="/space/edge/list"
              exact={true}
              component={EdgeList}
            />
            <PrivateRoute
              path={`/space/edge/create`}
              exact={true}
              component={CreateEdge}
            />
            <PrivateRoute
              path={`/space/edge/edit`}
              exact={true}
              render={props => (
                <EditEdge
                  asyncUpdateEditStatus={this.asyncUpdateEditStatus}
                  {...props}
                />
              )}
            />
            <PrivateRoute
              path="/space/index/list"
              exact={true}
              component={IndexList}
            />
            <PrivateRoute
              path={`/space/index/create`}
              exact={true}
              component={CreateIndex}
            />
            {/* TODO: 子路由里重定向问题 */}
            {/* <Redirect to={`/space/${space}/tag/list`} /> */}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(SpaceConfig));
