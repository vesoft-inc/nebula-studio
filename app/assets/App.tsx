import { Layout, Select, Spin } from 'antd';
import React from 'react';
import { hot } from 'react-hot-loader/root';
import intl from 'react-intl-universal';
import { BrowserRouter as Router, Redirect, Route, RouteComponentProps, Switch, withRouter } from 'react-router-dom';
import './App.less';
import { INTL_LOCALE_SELECT, INTL_LOCALES } from './config';
import { LanguageContext } from './context';
import { updateQueryStringParameter } from './utils';

import Console from './modules/Console';

const { Header, Content } = Layout;
const { Option } = Select;

interface IState {
  loading: boolean;
}

type IProps = RouteComponentProps;

class App extends React.Component<IProps, IState> {
  currentLocale;
  constructor(props: IProps) {
    super(props);

    const regx = /lang=(\w+)/g;
    const match = regx.exec(props.history.location.search);
    const defaultLocale = match
      ? match[1].toUpperCase()
      : INTL_LOCALE_SELECT.EN_US.NAME;
    this.currentLocale = defaultLocale;
    this.state = {
      loading: true,
    };
  }

  toggleLanguage = (locale: string) => {
    window.location.href = updateQueryStringParameter(
      window.location.href,
      'lang',
      locale,
    );
  }

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
  }

  componentDidMount() {
    this.loadIntlLocale();
  }

  render() {
    const { loading } = this.state;

    return (
      <Router>
      <LanguageContext.Provider
        value={{
          currentLocale: this.currentLocale,
          toggleLanguage: this.toggleLanguage,
        }}
      >
        <Spin spinning={loading}>
          <Layout className="nebula-web-console">
            <Header>
              <div className="lang-select">
                <span>{intl.get('common.languageSelect')}: </span>
                <Select
                  value={this.currentLocale}
                  onChange={this.toggleLanguage}
                >
                  {Object.keys(INTL_LOCALE_SELECT).map((locale) => (
                    <Option
                      key={locale}
                      value={INTL_LOCALE_SELECT[locale].NAME}
                    >
                      {INTL_LOCALE_SELECT[locale].TEXT}
                    </Option>
                  ))}
                </Select>
              </div>
            </Header>
            <Content>
              <Switch>
                <Route path="/" component={Console}></Route>
                <Redirect to="/"></Redirect>
              </Switch>
            </Content>
          </Layout>
        </Spin>
      </LanguageContext.Provider>
      </Router>
    );
  }
}

export default withRouter(hot(App));
