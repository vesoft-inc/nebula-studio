import { Dropdown, Icon, Layout, Menu, Select, Spin } from 'antd';
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

import IconFont from '#assets/components/Icon';
import { INTL_LOCALE_SELECT, INTL_LOCALES } from '#assets/config';
import service from '#assets/config/service';
import { LanguageContext } from '#assets/context';
import Console from '#assets/modules/Console';
import Explore from '#assets/modules/Explore';
import Import from '#assets/modules/Import';
import Schema from '#assets/modules/Schema';
import CreateSpace from '#assets/modules/Schema/CreateSpace';
import SpaceConfig from '#assets/modules/Schema/SpaceConfig';
import '#assets/static/fonts/iconfont.css';
import logo from '#assets/static/images/studio-logo.png';
import { IDispatch, IRootState } from '#assets/store';
import { updateQueryStringParameter } from '#assets/utils';

import './App.less';
import ConfigServer from './modules/ConfigServer';
import PrivateRoute from './PrivateRoute';
import { handleTrackEvent, trackEvent, trackPageView } from './utils/stat';

const { Header, Content } = Layout;
const { Option } = Select;

interface IState {
  loading: boolean;
  activeMenu: string;
}

const mapDispatch = (dispatch: IDispatch) => ({
  asyncClearConfigServer: dispatch.nebula.asyncClearConfigServer,
  asyncGetAppInfo: dispatch.app.asyncGetAppInfo,
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

  componentWillMount() {
    // Initialize the import task
    service.handleImportAction({ taskAction: 'actionStopAll' });
  }

  componentDidMount() {
    this.loadIntlLocale();
    this.renderMenu();
    this.props.asyncGetAppInfo();
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
                      <Icon type="import" />
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
                      <Icon type="branches" />
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
                      <Icon type="code" />
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
                          <Icon type="logout" />
                          {intl.get('configServer.clear')}
                        </a>
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <a className="ant-dropdown-link">
                    {intl.get('common.setting')} <Icon type="down" />
                  </a>
                </Dropdown>
                <Dropdown
                  className="help"
                  overlay={
                    <Menu>
                      <Menu.Item onClick={() => trackPageView('/user-mannual')}>
                        <a href={mannualHref} target="_blank">
                          <Icon type="compass" />
                          {intl.get('common.use')}
                        </a>
                      </Menu.Item>
                      <Menu.Item onClick={() => trackPageView('/nebula-doc')}>
                        <a href={nGQLHref} target="_blank">
                          <Icon type="star" />
                          nGQL
                        </a>
                      </Menu.Item>
                      <Menu.Item>
                        <a href={intl.get('common.forumLink')} target="_blank">
                          <Icon type="question" />
                          {intl.get('common.forum')}
                        </a>
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <a className="ant-dropdown-link">
                    {intl.get('common.help')} <Icon type="down" />
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
                    href="https://github.com/vesoft-inc/nebula-graph"
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
                            target="_blank"
                          >
                            <Icon type="tags" />
                            {intl.get('common.release')}
                          </a>
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <a>
                      v{appVersion}
                      <Icon type="down" />
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
