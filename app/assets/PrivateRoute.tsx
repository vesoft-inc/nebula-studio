import React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

import { IRootState } from '#assets/store';

const mapState = (state: IRootState) => ({
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
});

const mapDispatch = () => ({});

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      rest.host && rest.username && rest.password ? (
        <Component {...props} />
      ) : (
        <Redirect to="/config-server" />
      )
    }
  />
);

export default connect(mapState, mapDispatch)(PrivateRoute);
