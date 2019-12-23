import { Button, message, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import service from '#assets/config/service';
import { IDispatch } from '#assets/store';

const { TabPane } = Tabs;
const mapState = (state: any) => ({
  activeStep: state.importData.activeStep,
  importLoading: state.loading.effects.importData.importData,
  mountPath: state.importData.mountPath,
  isFinish: state.importData.isFinish,
  vertexesConfig: state.importData.vertexesConfig,
  edgesConfig: state.importData.edgesConfig,
  currentSpace: state.nebula.currentSpace,
  username: state.nebula.username,
  password: state.nebula.password,
  host: state.nebula.host,
  port: state.nebula.port,
});

const mapDispatch = (dispatch: IDispatch) => ({
  importData: dispatch.importData.importData,
  resetAllConfig: dispatch.importData.resetAllConfig,
  asyncCheckFinish: dispatch.importData.asyncCheckFinish,
  stopImport: dispatch.importData.stopImport,
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

interface IState {
  activeKey: string;
}

class Import extends React.Component<IProps, IState> {
  ref: HTMLDivElement;
  logTimer: any;
  finishTimer: any;

  constructor(props: IProps) {
    super(props);
    this.state = {
      activeKey: 'log',
    };
  }

  componentDidMount() {
    const {
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      activeStep,
      port,
    } = this.props;
    service
      .createConfigFile({
        currentSpace,
        username,
        password,
        host,
        vertexesConfig,
        edgesConfig,
        mountPath,
        activeStep,
        port,
      })
      .then((result: any) => {
        if (result.code !== '0') {
          message.error(intl.get('import.createConfigError'));
        }
      });
  }

  componentWillUnmount() {
    clearTimeout(this.logTimer);
    clearTimeout(this.finishTimer);
  }

  handleRunImport = () => {
    const {
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      activeStep,
      port,
    } = this.props;
    this.props.importData({
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      activeStep,
      port,
    });
    this.logTimer = setTimeout(this.readlog, 2000);
    this.finishTimer = setTimeout(this.checkFinish, 1000);
  };

  checkFinish = async () => {
    const { asyncCheckFinish } = this.props;
    const result: any = await asyncCheckFinish();
    if (result.data) {
      clearTimeout(this.finishTimer);
    } else {
      this.finishTimer = setTimeout(this.checkFinish, 1000);
    }
  };

  readlog = async () => {
    const { mountPath } = this.props;
    const result: any = await service.getLog({
      dir: mountPath,
    });
    if (result.code === '0') {
      this.logTimer = setTimeout(this.readlog, 2000);
      this.ref.innerHTML = result.data;
    } else {
      clearTimeout(this.logTimer);
    }
    this.ref.scrollTop = this.ref.scrollHeight;
  };

  handleTab = (key: string) => {
    this.setState({
      activeKey: key,
    });
  };

  handleAgainImport = () => {
    this.handleTab('log');
    this.handleRunImport();
  };

  render() {
    const { isFinish, vertexesConfig, edgesConfig, mountPath } = this.props;
    const { activeKey } = this.state;
    return (
      <div className="import">
        <div className="imprt-btn">
          <Button
            className="import-again"
            onClick={this.handleRunImport}
            disabled={!isFinish}
          >
            {intl.get('import.runImport')}
          </Button>
          <Button
            className="import-again"
            onClick={this.props.stopImport}
            disabled={isFinish}
          >
            {intl.get('import.endImport')}
          </Button>
        </div>
        <Tabs activeKey={activeKey} size="large" onChange={this.handleTab}>
          <TabPane tab="log" key="log">
            <div
              className="import-log"
              ref={(ref: HTMLDivElement) => (this.ref = ref)}
            />
          </TabPane>
          <TabPane tab={intl.get('import.importResults')} key="export">
            <Button
              className="import-again"
              onClick={this.props.resetAllConfig}
              disabled={!isFinish}
            >
              {intl.get('import.newImport')}
            </Button>
            <Button
              className="import-again"
              onClick={this.handleAgainImport}
              disabled={!isFinish}
            >
              {intl.get('import.againImport')}
            </Button>
            <div className="import-export">
              <div>
                {intl.get('import.configFilePath')} (
                {`${mountPath}/tmp/config.yaml`}) ：
                <a href={`file://${mountPath}/tmp/config.yaml`}>config.yml</a>
              </div>
              <div>
                {intl.get('import.logFilePath')} (
                {`${mountPath}/tmp/import.log`}) ：
                <a href={`file://${mountPath}/tmp/import.log`}>import.log</a>
              </div>
              <br />
              {vertexesConfig.map(vertex => {
                return (
                  <div key={vertex.name}>
                    <p>{intl.get('import.vertexesFilePath')}</p>
                    <br />
                    <p>
                      {`${intl.get('import.vertexFilePath')} ${
                        vertex.file.path
                      }`}
                    </p>
                    <p>
                      {intl.get('import.vertexErrorFilePath')} ({mountPath}
                      /tmp/err/${vertex.name}Fail.scv):
                      <a
                        href={`file://${mountPath}/tmp/err/${
                          vertex.name
                        }Fail.scv`}
                      >
                        {vertex.name}
                      </a>
                    </p>
                  </div>
                );
              })}
              <br />
              {edgesConfig.map(edge => {
                return (
                  <div key={edge.name}>
                    <p>{intl.get('import.edgesFilePath')}</p>
                    <br />
                    <p>
                      {`${intl.get('import.edgeFilePath')} ${edge.file.path}`}
                    </p>
                    <p>
                      {intl.get('import.edgeErrorFilePath')} ({mountPath}
                      /tmp/err/${edge.name}Fail.scv):
                      <a
                        href={`file://${mountPath}tmp/err/${edge.name}Fail.scv`}
                      >
                        {edge.name}
                      </a>
                    </p>
                  </div>
                );
              })}
            </div>
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch,
)(Import);
