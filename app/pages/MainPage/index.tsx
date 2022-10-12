import React, { Suspense } from 'react';
import { Layout, Spin } from 'antd';
import { Redirect, Route, Switch } from 'react-router-dom';
import { shouldAlwaysShowWelcome } from '@app/pages/Welcome';
import ErrorBoundary from '@app/components/ErrorBoundary';
import { MENU_LIST, RoutesList } from './routes';
import './index.less';

import Header from './Header';
const { Content } = Layout;

const MainPage = () => {
  const redirectPath = shouldAlwaysShowWelcome() ? '/welcome' : '/console';
  return (
    <Layout className="nebulaStudioLayout">
      <Header menus={MENU_LIST} />
      <ErrorBoundary>
        <Switch>
          {RoutesList.map((route) => (
            <Route
              path={route.path}
              render={() => (
                <>
                  <Suspense fallback={<Spin />}>
                    <Content>
                      <Route component={route.component} />
                    </Content>
                  </Suspense>
                </>
              )}
              key={route.path}
              exact={route.exact}
            />
          ))}
          <Redirect from="/" to={{ pathname: redirectPath, search: location.search }} />
        </Switch>
      </ErrorBoundary>
    </Layout>
  );
};
export default MainPage;
