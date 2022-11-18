import { hot } from 'react-hot-loader/root';
import { Spin, message } from 'antd';
import React, { Suspense, lazy, useEffect } from 'react';
import ReactDom from 'react-dom';
import { Route, BrowserRouter as Router, Switch, useHistory } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import Cookie from 'js-cookie';
import { trackPageView } from '@app/utils/stat';
import { I18nProvider, getI18n } from '@vesoft-inc/i18n';
import { INTL_LOCALES } from '@app/config/constants';
import { useStore } from '@app/stores';
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
const { initI18n } = getI18n();
initI18n(defaultLanguage, INTL_LOCALES);
const PageRoot = observer(() => {
  const { global: { version } } = useStore();
  useEffect(() => {
    trackPageView(`Studio/v${version}`);
  }, []);

  return (
    <StoreProvider value={rootStore}>
      <I18nProvider locales={INTL_LOCALES}>
        <Router>
          <App />
        </Router>
      </I18nProvider>
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
