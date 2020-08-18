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

import { INTL_LOCALE_SELECT, INTL_LOCALES } from '#assets/config';
import service from '#assets/config/service';
import { LanguageContext } from '#assets/context';
import Console from '#assets/modules/Console';
import Explore from '#assets/modules/Explore';
import Import from '#assets/modules/Import';
import { IDispatch, IRootState } from '#assets/store';
import { updateQueryStringParameter } from '#assets/utils';

import './App.less';
import ConfigServer from './modules/ConfigServer';
import PrivateRoute from './PrivateRoute';
import { trackPageView } from './utils/stat';

const { Header, Content } = Layout;
const { Option } = Select;

interface IState {
  loading: boolean;
  activeMenu: string;
}

const mapDispatch = (dispatch: IDispatch) => ({
  clearConfig: dispatch.nebula.clearConfig,
  asyncGetAppInfo: dispatch.app.asyncGetAppInfo,
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
      activeMenu: props.location.pathname.split('/').pop() || '',
    };
  }

  toggleLanguage = (locale: string) => {
    cookies.set('locale', locale);
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
    service.stopImport({ taskId: 'all' });
  }

  componentDidMount() {
    this.loadIntlLocale();
    this.props.asyncGetAppInfo();
  }

  componentDidUpdate(prevProps: IProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.setState({
        activeMenu: this.props.location.pathname.split('/').pop() || '',
      });
    }
  }

  handleClear = () => {
    this.props.clearConfig();
  };

  render() {
    const { appVersion } = this.props;
    const { loading, activeMenu } = this.state;
    const nGQLHref =
      cookies.get('locale') === 'ZH_CN'
        ? 'https://github.com/vesoft-inc/nebula-docs-cn/blob/master/docs/manual-CN/README.md'
        : 'https://github.com/vesoft-inc/nebula-docs/blob/master/docs/manual-EN/README.md';
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
                <Menu
                  mode="horizontal"
                  selectedKeys={[activeMenu]}
                  onClick={this.handleMenuClick as any}
                >
                  <Menu.Item key="console">
                    <Link to="console">
                      <Icon type="code" />
                      {intl.get('common.console')}
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="import">
                    <Link to="import">
                      <Icon type="import" />
                      {intl.get('common.import')}
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="explore">
                    <Link to="explore">
                      <Icon type="branches" />
                      {intl.get('common.explore')}
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
                          <Icon type="setting" />
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
                        <a
                          href="https://github.com/vesoft-inc/nebula-web-docker"
                          target="_blank"
                        >
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
                        <a
                          href="https://github.com/vesoft-inc/nebula-web-docker/issues"
                          target="_blank"
                        >
                          <Icon type="bug" />
                          {intl.get('common.feedback')}
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
                {appVersion && (
                  <Dropdown
                    className="version"
                    overlay={
                      <Menu>
                        <Menu.Item>
                          <a
                            href="https://github.com/vesoft-inc/nebula-web-docker/blob/master/CHANGELOG.md"
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
                  <PrivateRoute path="/console" component={Console} />
                  <PrivateRoute path="/explore" component={Explore} />
                  <PrivateRoute path="/import" component={Import} />
                  <Route path="/config-server" component={ConfigServer} />
                  <Redirect to="/console" />
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
