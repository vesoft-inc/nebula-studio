import { Dropdown, Icon, Layout, Menu, Select, Spin } from 'antd';
import cookies from 'js-cookie';
import React from 'react';
import { hot } from 'react-hot-loader/root';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import {
  BrowserRouter as Router,
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
import { IDispatch } from '#assets/store';
import { updateQueryStringParameter } from '#assets/utils';

import './App.less';
import ConfigServer from './modules/ConfigServer';
import PrivateRoute from './PrivateRoute';

const { Header, Content } = Layout;
const { Option } = Select;

interface IState {
  loading: boolean;
  activeMenu: string;
}

const mapDispatch = (dispatch: IDispatch) => ({
  asyncClearConfig: dispatch.nebula.asyncClearConfig,
});

const mapState = () => ({});

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
  }

  handleClear = () => {
    this.props.asyncClearConfig();
  };

  render() {
    const { loading, activeMenu } = this.state;

    return (
      <Router>
        <LanguageContext.Provider
          value={{
            currentLocale: this.currentLocale,
            toggleLanguage: this.toggleLanguage,
          }}
        >
          {loading ? (
            <Spin />
          ) : (
            <Layout className="nebula-web-console">
              <Header>
                <Menu
                  mode="horizontal"
                  selectedKeys={[activeMenu]}
                  onClick={this.handleMenuClick as any}
                >
                  <Menu.Item key="console">
                    <Link to="/console">
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
                      <Icon type="eye" />
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
                      <Menu.Item>
                        <a
                          href="https://github.com/vesoft-inc/nebula-web-console/blob/master/CHANGELOG.md"
                          target="_blank"
                        >
                          <Icon type="tags" />
                          {intl.get('common.release')}
                        </a>
                      </Menu.Item>
                      <Menu.Item>
                        <a
                          href="https://github.com/vesoft-inc/nebula/blob/master/README.md"
                          target="_blank"
                        >
                          <Icon type="tags" />
                          {intl.get('common.nebula')}
                        </a>
                      </Menu.Item>
                      <Menu.Item>
                        <a
                          href="https://github.com/vesoft-inc/nebula-web-docker/issues"
                          target="_blank"
                        >
                          <Icon type="tags" />
                          {intl.get('common.feedback')}
                        </a>
                      </Menu.Item>
                    </Menu>
                  }
                >
                  <a className="ant-dropdown-link">
                    {intl.get('common.help')} <Icon type="down" />
                  </a>
                </Dropdown>
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
      </Router>
    );
  }
}

export default connect(mapState, mapDispatch)(withRouter(hot(App)));
