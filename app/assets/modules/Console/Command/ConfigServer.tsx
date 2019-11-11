import { Button, Icon } from 'antd';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import ConfigServerForm from '#assets/components/ConfigServerForm';
import { IDispatch, IRootState } from '#assets/store';

import './ConfigServer.less';

interface IState {
  success: boolean;
}

const mapDispatch = (dispatch: IDispatch) => ({
  asyncClearConfig: dispatch.nebula.asyncClearConfig,
  asyncConfigServer: dispatch.nebula.asyncConfigServer,
});

const mapState = (state: IRootState) => ({
  host: state.nebula.host,
  username: state.nebula.username,
  password: state.nebula.password,
});

interface IProps
  extends ReturnType<typeof mapDispatch>,
    ReturnType<typeof mapState> {}

class ConfigServer extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
  }

  handleConfig = (form: WrappedFormUtils) => {
    form.validateFields(async (errs, data) => {
      if (!errs) {
        this.props.asyncConfigServer(data);
      }
    });
  };

  handleClear = () => {
    this.props.asyncClearConfig();
  };

  renderSuccess = () => {
    const { host, username } = this.props;
    return (
      <div className="config-server command">
        <div className="icon-wrapper">
          <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" />
          <h3>{intl.get('configServer.success')}</h3>
          <p>
            <strong>{intl.get('configServer.host')}:</strong>
            <span>{host}</span>
            <strong>{intl.get('configServer.username')}:</strong>
            <span>{username}</span>
          </p>
          <Button size="small" onClick={this.handleClear}>
            {intl.get('configServer.clear')}
          </Button>
        </div>
      </div>
    );
  };

  render() {
    const { host, username, password } = this.props;
    if (host && username && password) {
      return this.renderSuccess();
    }

    return (
      <div className="config-server">
        <ConfigServerForm onConfig={this.handleConfig} />
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(ConfigServer);
