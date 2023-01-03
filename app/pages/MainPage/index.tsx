import React, { Suspense, useEffect } from 'react';
import { Layout, notification, Spin } from 'antd';
import { Redirect, Route, Switch } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useI18n } from '@vesoft-inc/i18n';
import { shouldAlwaysShowWelcome } from '@app/pages/Welcome';
import ErrorBoundary from '@app/components/ErrorBoundary';
import { useStore } from '@app/stores';
import { MENU_LIST, RoutesList } from './routes';
import './index.less';

import Header from './Header';
const { Content } = Layout;

const MainPage = () => {
  const redirectPath = shouldAlwaysShowWelcome() ? '/welcome' : '/console';
  const { schema } = useStore();
  const { intl } = useI18n();
  const { currentSpace, switchSpace } = schema;

  useEffect(() => {
    const handleWindowFocus = async () => {
      const currentStorageSpace = localStorage.getItem('currentSpace');
      if (currentStorageSpace && currentSpace !== currentStorageSpace) {
        notification.open({
          type: 'info',
          message: intl.get('common.spaceChangeTitle'),
          description: intl.get('common.spaceChangeDescription'),
          maxCount: 1,
        });
        await switchSpace(currentStorageSpace);
      }
    };
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [currentSpace]);

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
export default observer(MainPage);
