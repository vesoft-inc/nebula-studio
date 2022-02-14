import { hot } from 'react-hot-loader/root';
import React from 'react';
import ReactDom from 'react-dom';
import { BrowserRouter as Router, Route, Switch, Redirect, useHistory, useLocation } from 'react-router-dom';
import Login from '@appv2/pages/Login';
import { observer } from 'mobx-react-lite';
import Import from '@appv2/pages/Import';
import TaskCreate from '@appv2/pages/Import/TaskCreate';
import rootStore, { StoreProvider } from './stores';

const PageRoot = observer(() => {
  return (
    <StoreProvider value={rootStore}>
      <Router key={rootStore.global.currentLocale}>
        <App />
      </Router>
    </StoreProvider>
  );
});

const App = () => {
  const history = useHistory();
  const location = useLocation();
  rootStore.global.history = history;

  return (
    <Switch>
      <Route path="/login" exact component={Login} />
      <Route path="/import/create" exact component={TaskCreate} />
      <Route path="/import/:type" component={Import} />
      <Redirect from="/" to={{ pathname: '/login', search: location.search }} />
    </Switch>
  );
};

const HotPageRoot = hot(PageRoot);

ReactDom.render(<HotPageRoot />, document.getElementById('app'));
