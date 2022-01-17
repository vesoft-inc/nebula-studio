import { WrappedFormUtils } from 'antd/lib/form/Form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import ConfigServerForm from '#app/components/ConfigServerForm';
import { IDispatch } from '#app/store';
import { trackPageView } from '#app/utils/stat';

import './index.less';

const mapDispatch = (dispatch: IDispatch) => ({
  asyncConfigServer: dispatch.nebula.asyncConfigServer,
});

const mapState = () => ({});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    RouteComponentProps {}

class ConfigServer extends React.Component<IProps> {
  componentDidMount() {
    trackPageView('/connect-server');
  }

  handleConfigServer = (form: WrappedFormUtils) => {
    form.validateFields(async (err, data) => {
      if (!err) {
        const ok = await this.props.asyncConfigServer(data);
        if (ok) {
          this.props.history.replace('/');
        }
      }
    });
  };
  render() {
    return (
      <div className="config-server">
        <div className="nebula-authorization">
          <h3>{intl.get('configServer.title')}</h3>
          <ConfigServerForm onConfig={this.handleConfigServer} />
        </div>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(ConfigServer);
