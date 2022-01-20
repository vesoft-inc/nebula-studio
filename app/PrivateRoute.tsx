import React from 'react';
import { connect } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';

import { IRootState } from './store';

const mapState = (state: IRootState) => ({
  host: state.nebula.host,
  username: state.nebula.username,
});

const mapDispatch = () => ({});

interface IProps extends ReturnType<typeof mapDispatch>,
  ReturnType<typeof mapState>{
  component: any;
  render: any
}

const PrivateRoute = (props: IProps) => {
  const { component: Component, render, ...rest } = props;
  if (rest.host && rest.username) {
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
