import { WrappedFormUtils } from 'antd/lib/form/Form';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import ConfigServerForm from '#assets/components/ConfigServerForm';
import { IDispatch } from '#assets/store';
import { trackPageView } from '#assets/utils/stat';

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
    trackPageView('/config-server');
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
        <h3>{intl.get('configServer.title')}</h3>
        <ConfigServerForm onConfig={this.handleConfigServer} />
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(ConfigServer);
