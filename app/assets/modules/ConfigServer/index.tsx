import { WrappedFormUtils } from 'antd/lib/form/Form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import ConfigServerForm from '#assets/components/ConfigServerForm';
import { IDispatch, IRootState } from '#assets/store';

import './index.less';

const mapDispatch = (dispatch: IDispatch) => ({
  asyncConfigServer: dispatch.nebula.asyncConfigServer,
});

const mapState = (state: IRootState) => ({
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    RouteComponentProps {}

class ConfigServer extends React.Component<IProps> {
  checkIsNeedConfig = () => {
    const { username, host, password } = this.props;
    if (username && host && password) {
      this.props.history.push('/');
    }
  };

  componentDidMount() {
    this.checkIsNeedConfig();
  }

  componentDidUpdate() {
    this.checkIsNeedConfig();
  }

  handleConfigServer = (form: WrappedFormUtils) => {
    form.validateFields(async (err, data) => {
      if (!err) {
        const isOk = await this.props.asyncConfigServer(data);
        if (isOk) {
          this.props.history.goBack();
        }
      }
    });
  };
  render() {
    return (
      <div className="config-server">
        <h3>{intl.get('configServer.title')}</h3>
        <ConfigServerForm onConfig={this.handleConfigServer} />
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(ConfigServer);
