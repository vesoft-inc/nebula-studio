import { Dropdown, Layout, Menu, Select, Spin } from 'antd';
import cookies from 'js-cookie';
import React from 'react';
import { hot } from 'react-hot-loader/root';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import {
  Link,
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
  withRouter,
} from 'react-router-dom';

import { BranchesOutlined, CodeOutlined, CompassOutlined, DownOutlined, ImportOutlined, LogoutOutlined, QuestionCircleOutlined, StarOutlined, TagsOutlined } from '@ant-design/icons';
import ConfigServer from './modules/ConfigServer';
import PrivateRoute from './PrivateRoute';
import IconFont from '#app/components/Icon';
import { INTL_LOCALES, INTL_LOCALE_SELECT } from '#app/config';
import service from '#app/config/service';
import { LanguageContext } from '#app/context';
import Console from '#app/modules/Console';
import Explore from '#app/modules/Explore';
import Import from '#app/modules/Import';
import Schema from '#app/modules/Schema';
import CreateSpace from '#app/modules/Schema/CreateSpace';
import SpaceConfig from '#app/modules/Schema/SpaceConfig';
import '#app/static/fonts/iconfont.css';
import logo from '#app/static/images/studio-logo.png';
import { IDispatch, IRootState } from '#app/store';
import { updateQueryStringParameter } from '#app/utils';

import './App.less';
import { handleTrackEvent, trackEvent, trackPageView } from './utils/stat';

const { Header, Content } = Layout;
const { Option } = Select;

interface IState {
  loading: boolean;
  activeMenu: string;
}

const mapDispatch = (dispatch: IDispatch) => ({
  asyncClearConfigServer: dispatch.nebula.asyncClearConfigServer,
  asyncSwitchSpace: dispatch.nebula.asyncSwitchSpace,
});

const mapState = (state: IRootState) => ({
  appVersion: state.app.version,
});

interface IProps
  extends RouteComponentProps,
  ReturnType<typeof mapDispatch>,
  ReturnType<typeof mapState> {}

class App extends React.Component<IProps, IState> {
  currentLocale;
  constructor(props: IProps) {
    super(props);

    const regx = /lang=(\w+)/g;
    const match = regx.exec(props.history.location.search);

    if (match) {
      cookies.set('locale', match[1].toUpperCase());
    } else {
      cookies.set('locale', 'ZH_CN');
    }

    this.currentLocale = cookies.get('locale');
    this.state = {
      loading: true,
      activeMenu: '',
    };
  }

  toggleLanguage = (locale: string) => {
    cookies.set('locale', locale);
    trackEvent('navigation', 'change_language', locale);
    window.location.href = updateQueryStringParameter(
      window.location.href,
      'lang',
      locale,
    );
  };

  loadIntlLocale = () => {
    intl
      .init({
        currentLocale: this.currentLocale,
        locales: INTL_LOCALES,
      })
      .then(() => {
        this.setState({
          loading: false,
        });
      });
  };

  handleMenuClick = ({ key }) => {
    if (key === 'newRelease') {
      return;
    }
    this.setState({
      activeMenu: key,
    });
  };

  UNSAFE_componentWillMount() {
    // Initialize the import task
    service.handleImportAction({ taskAction: 'actionStopAll' });
  }

  componentDidMount() {
    this.loadIntlLocale();
    this.renderMenu();
    const space = sessionStorage.getItem('currentSpace');
    if (space) {
      this.props.asyncSwitchSpace(space);
    }
    document.addEventListener('click', handleTrackEvent);
  }

  componentDidUpdate(prevProps: IProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.renderMenu();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', handleTrackEvent);
  }
  renderMenu = () => {
    const path = this.props.location.pathname.split('/')[1] || '';
    this.setState({
      activeMenu: path === 'space' ? 'schema' : path,
    });
  };

  handleClear = () => {
    this.props.asyncClearConfigServer();
  };

  render() {
    const { appVersion } = this.props;
    const { loading, activeMenu } = this.state;
    const locale = cookies.get('locale');
    const nGQLHref =
      locale === 'ZH_CN'
        ? 'https://docs.nebula-graph.com.cn/2.5.0/3.ngql-guide/1.nGQL-overview/1.overview/'
        : 'https://docs.nebula-graph.io/2.5.0/3.ngql-guide/1.nGQL-overview/1.overview/';
    const mannualHref =
      locale === 'ZH_CN'
        ? 'https://docs.nebula-graph.com.cn/2.5.0/nebula-studio/about-studio/st-ug-what-is-graph-studio/'
        : 'https://docs.nebula-graph.io/2.5.0/nebula-studio/about-studio/st-ug-what-is-graph-studio/';
    const versionLogHref =
      locale === 'ZH_CN'
        ? 'https://docs.nebula-graph.com.cn/2.5.0/nebula-studio/about-studio/st-ug-release-note/'
        : 'https://docs.nebula-graph.io/2.5.0/nebula-studio/about-studio/st-ug-release-note/';
    return (
      <>
        <LanguageContext.Provider
          value={{
            currentLocale: this.currentLocale,
            toggleLanguage: this.toggleLanguage,
          }}
        >
          {loading ? (
            <Spin />
          ) : (
            <Layout className="nebula-graph-studio">
              <Header>
                <div className="studio-logo">
                  <img src={logo} />
                </div>
                <Menu
                  mode="horizontal"
                  selectedKeys={[activeMenu]}
                  onClick={this.handleMenuClick as any}
                >
                  <Menu.Item key="schema">
                    <Link
                      to="/schema"
                      data-track-category="navigation"
                      data-track-action="view_schema"
                      data-track-label="from_navigation"
                    >
                      <IconFont type="iconnav-model" />
                      {intl.get('common.schema')}
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="import">
                    <Link
                      to="/import"
                      data-track-category="navigation"
                      data-track-action="view_import"
                      data-track-label="from_navigation"
                    >
                      <ImportOutlined />
                      {intl.get('common.import')}
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="explore">
                    <Link
                      to="/explore"
                      data-track-category="navigation"
                      data-track-action="view_explore"
                      data-track-label="from_navigation"
                    >
                      <BranchesOutlined />
                      {intl.get('common.explore')}
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="console">
                    <Link
                      to="/console"
                      data-track-category="navigation"
                      data-track-action="view_console"
                      data-track-label="from_navigation"
                    >
                      <CodeOutlined />
                      {intl.get('common.console')}
                    </Link>
                  </Menu.Item>
                </Menu>
                <div className="lang-select">
                  <span>{intl.get('common.languageSelect')}: </span>
                  <Select
                    value={this.currentLocale}
                    onChange={this.toggleLanguage}
                  >
                    {Object.keys(INTL_LOCALE_SELECT).map(locale => (
                      <Option
                        key={locale}
                        value={INTL_LOCALE_SELECT[locale].NAME}
                      >
                        {INTL_LOCALE_SELECT[locale].TEXT}
                      </Option>
                    ))}
                  </Select>
                </div>
                <Dropdown
                  className="setting"
                  overlay={
                    <Menu>
                      <Menu.Item>
                        <a onClick={this.handleClear}>
                          <LogoutOutlined />
                          {intl.get('configServer.clear')}
                        </a>
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <a className="ant-dropdown-link">
                    {intl.get('common.setting')} <DownOutlined />
                  </a>
                </Dropdown>
                <Dropdown
                  className="help"
                  overlay={
                    <Menu>
                      <Menu.Item onClick={() => trackPageView('/user-mannual')}>
                        <a href={mannualHref} target="_blank" rel="noreferrer">
                          <CompassOutlined />
                          {intl.get('common.use')}
                        </a>
                      </Menu.Item>
                      <Menu.Item onClick={() => trackPageView('/nebula-doc')}>
                        <a href={nGQLHref} target="_blank" rel="noreferrer">
                          <StarOutlined />
                          nGQL
                        </a>
                      </Menu.Item>
                      <Menu.Item>
                        <a href={intl.get('common.forumLink')} target="_blank" rel="noreferrer">
                          <QuestionCircleOutlined />
                          {intl.get('common.forum')}
                        </a>
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <a className="ant-dropdown-link">
                    {intl.get('common.help')} <DownOutlined />
                  </a>
                </Dropdown>
                <div
                  className="github-star"
                  data-track-category="navigation"
                  data-track-action="star_github"
                  data-track-label="from_navigation"
                >
                  <a
                    className="github-button"
                    href="https://github.com/vesoft-inc/nebula"
                    data-size="large"
                    data-show-count="true"
                    aria-label="Star vesoft-inc/nebula on GitHub"
                  >
                    Star
                  </a>
                </div>
                {appVersion && (
                  <Dropdown
                    className="version"
                    overlay={
                      <Menu>
                        <Menu.Item>
                          <a
                            data-track-category="navigation"
                            data-track-action="view_changelog"
                            href={versionLogHref}
                            target="_blank" rel="noreferrer"
                          >
                            <TagsOutlined />
                            {intl.get('common.release')}
                          </a>
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <a>
                      v{appVersion}
                      <DownOutlined />
                    </a>
                  </Dropdown>
                )}
              </Header>
              <Content>
                <Switch>
                  <PrivateRoute
                    path="/schema"
                    exact={true}
                    component={Schema}
                  />
                  <PrivateRoute
                    path="/space/create"
                    exact={true}
                    component={CreateSpace}
                  />
                  <PrivateRoute
                    path="/space/:space/:type?/:action?"
                    component={SpaceConfig}
                  />
                  <PrivateRoute
                    path="/import"
                    exact={true}
                    component={Import}
                  />
                  <PrivateRoute
                    path="/explore"
                    exact={true}
                    component={Explore}
                  />
                  <PrivateRoute
                    path="/console"
                    exact={true}
                    component={Console}
                  />
                  <Route
                    path="/connect-server"
                    exact={true}
                    component={ConfigServer}
                  />
                  <Redirect to="/explore" />
                </Switch>
              </Content>
            </Layout>
          )}
        </LanguageContext.Provider>
      </>
    );
  }
}

export default withRouter(connect(mapState, mapDispatch)(hot(App)));
