import { hot } from 'react-hot-loader/root';
import { Spin } from 'antd';
import React, { Suspense, lazy, useState } from 'react';
import ReactDom from 'react-dom';
import { Route, BrowserRouter as Router, Switch, useHistory } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import rootStore, { StoreProvider } from './stores';
import dayjs from 'dayjs';
import intl from 'react-intl-universal';
import duration from 'dayjs/plugin/duration';
import AuthorizedRoute from './AuthorizedRoute';
import '@appv2/static/fonts/iconfont.css';
import Cookie from 'js-cookie';
import { INTL_LOCALES } from '@appv2/config/constants';
import { LanguageContext } from '@appv2/context';

const Login = lazy(() => import('@appv2/pages/Login'));
const MainPage = lazy(() => import('@appv2/pages/MainPage'));

dayjs.extend(duration);

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

ReactDom.render(<HotPageRoot />, document.getElementById('app'));
