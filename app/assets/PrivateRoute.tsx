import React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

import { IRootState } from './store';

const mapState = (state: IRootState) => ({
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
});

const mapDispatch = () => ({});

const PrivateRoute = ({ component: Component, render, ...rest }) => {
  if (rest.host && rest.username && rest.password) {
    return Component ? (
      <Route {...rest} render={props => <Component {...props} />} />
    ) : (
      <Route render={render} {...rest} />
    );
  } else {
    return <Redirect to="/connect-server" {...rest} />;
  }
};

export default connect(mapState, mapDispatch)(PrivateRoute);
