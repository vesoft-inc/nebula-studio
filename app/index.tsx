import { hot } from 'react-hot-loader/root';
import { Spin, message } from 'antd';
import React, { Suspense, lazy, useState } from 'react';
import ReactDom from 'react-dom';
import { Route, BrowserRouter as Router, Switch, useHistory } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import intl from 'react-intl-universal';
import duration from 'dayjs/plugin/duration';
import Cookie from 'js-cookie';
import { INTL_LOCALES } from '@app/config/constants';
import { LanguageContext } from '@app/context';
import AuthorizedRoute from './AuthorizedRoute';
import rootStore, { StoreProvider } from './stores';
const Login = lazy(() => import('@app/pages/Login'));
const MainPage = lazy(() => import('@app/pages/MainPage'));

import './common.less';
import './app.less';
dayjs.extend(duration);
message.config({
  maxCount: 1,
});
const defaultLanguage = Cookie.get('lang') || document.documentElement.getAttribute('lang');
intl.init({
  currentLocale: defaultLanguage || 'EN_US',
  locales: INTL_LOCALES,
});


const PageRoot = observer(() => {
  const [currentLocale, setCurrentLocale] = useState(
    defaultLanguage || 'EN-US',
  );

  const toggleLanguage = (locale: string) => {
    Cookie.set('lang', locale);
    setCurrentLocale(locale);
    intl
      .init({
        currentLocale: locale,
        locales: INTL_LOCALES,
      });
  };

  return (
    <StoreProvider value={rootStore}>
      <LanguageContext.Provider
        value={{
          currentLocale,
          toggleLanguage,
        }}
      >
        <Router>
          <App />
        </Router>
      </LanguageContext.Provider>
    </StoreProvider>
  );
});

const App = () => {
  const history = useHistory();
  rootStore.global.history = history;

  return (
    <Switch>
      <Suspense fallback={<Spin />}>
        <Route path="/login" exact={true} component={Login} />
        <AuthorizedRoute component={MainPage} />
      </Suspense>
    </Switch>
  );
};

const HotPageRoot = hot(PageRoot);

ReactDom.render(<HotPageRoot />, document.getElementById('studioApp'));
