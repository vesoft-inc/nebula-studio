import React from 'react';
import { connect } from 'react-redux';
import { Route } from 'react-router-dom';

import ConfigServer from '#assets/modules/ConfigServer';

import { IRootState } from './store';

const mapState = (state: IRootState) => ({
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
});

const mapDispatch = () => ({});

const PrivateRoute = ({ component: Component, ...rest }) => {
  return (
    <Route
      {...rest}
      render={props =>
        rest.host && rest.username && rest.password ? (
          <Component {...props} />
        ) : (
          <ConfigServer />
        )
      }
    />
  );
};

export default connect(mapState, mapDispatch)(PrivateRoute);
