import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { useStore } from '@app/stores';
interface IProps {
  component?: any;
  render?: any
}

const AuthorizedRoute = (props: IProps) => {
  const { component: Component, render, ...rest } = props;
  const { global: { host, username } } = useStore();
  if (host && username) {
    return Component ? (
      <Route {...rest} render={props => <Component {...props} />} />
    ) : (
      <Route render={render} {...rest} />
    );
  } else {
    return <Redirect to="/login" />;
  }
};

export default observer(AuthorizedRoute);
