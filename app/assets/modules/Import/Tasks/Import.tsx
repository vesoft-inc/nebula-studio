import { Button, message, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import service from '#assets/config/service';
import { IDispatch } from '#assets/store';
import { configToJson, getStringByteLength } from '#assets/utils/import';

const { TabPane } = Tabs;
const mapState = (state: any) => ({
  activeStep: state.importData.activeStep,
  importLoading: state.loading.effects.importData.importData,
  mountPath: state.importData.mountPath,
  isImporting: state.importData.isImporting,
  vertexesConfig: state.importData.vertexesConfig,
  edgesConfig: state.importData.edgesConfig,
  taskId: state.importData.taskId,
  currentSpace: state.nebula.currentSpace,
  username: state.nebula.username,
  password: state.nebula.password,
  host: state.nebula.host,
});

const mapDispatch = (dispatch: IDispatch) => ({
  importData: dispatch.importData.importData,
  resetAllConfig: dispatch.importData.resetAllConfig,
  update: dispatch.importData.update,
  stopImport: dispatch.importData.stopImport,
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

interface IState {
  activeKey: string;
  startByte: number;
  endByte: number;
}

class Import extends React.Component<IProps, IState> {
  ref: HTMLDivElement;
  logTimer: any;

  constructor(props: IProps) {
    super(props);
    this.state = {
      activeKey: 'log',
      startByte: 0,
      endByte: 1000000,
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
    } = this.props;
    const config: any = configToJson({
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      activeStep,
    });
    service
      .createConfigFile({
        config,
        mountPath,
      })
      .then((result: any) => {
        if (result.code !== '0') {
          message.error(intl.get('import.createConfigError'));
        }
      });
  }

  componentWillUnmount() {
    clearTimeout(this.logTimer);
  }

  handleRunImport = async () => {
    const {
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      activeStep,
    } = this.props;
    const errCode: any = await this.props.importData({
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      mountPath,
      activeStep,
    });
    if (errCode === 0) {
      this.logTimer = setTimeout(this.readlog, 2000);
    }
  };

  readlog = async () => {
    const { startByte, endByte } = this.state;
    const { mountPath, taskId, update } = this.props;
    const result: any = await service.getLog({
      dir: mountPath,
      startByte,
      endByte,
      taskId,
    });
    const byteLength = getStringByteLength(result.data);
    if (result.data && result.code === '0') {
      this.setState(
        {
          startByte: startByte + byteLength,
          endByte: startByte + byteLength + 1000000,
        },
        () => {
          this.logTimer = setTimeout(this.readlog, 2000);
        },
      );
      this.ref.innerHTML += result.data;
    } else {
      if (result.code === '0') {
        this.logTimer = setTimeout(this.readlog, 2000);
      } else {
        this.setState({
          startByte: 0,
          endByte: 1000000,
        });
        update({
          isImporting: true,
        });
        clearTimeout(this.logTimer);
      }
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
    const {
      isImporting,
      vertexesConfig,
      edgesConfig,
      mountPath,
      taskId,
    } = this.props;
    const { activeKey } = this.state;
    return (
      <div className="import">
        <div className="import-btn">
          <Button
            className="import-again"
            onClick={this.handleRunImport}
            disabled={!isImporting}
          >
            {intl.get('import.runImport')}
          </Button>
          <Button
            className="import-again"
            onClick={() => this.props.stopImport({ taskId })}
            disabled={isImporting}
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
              disabled={!isImporting}
            >
              {intl.get('import.newImport')}
            </Button>
            <div className="import-export">
              <div>
                {intl.get('import.configFilePath')}
                <a href={`${mountPath}/tmp/config.yaml`} target="__blank">
                  config.yaml
                </a>
              </div>
              <div>
                {intl.get('import.logFilePath')}
                <a href={`${mountPath}/tmp/import.log`} target="__blank">
                  import.log
                </a>
              </div>
              <br />
              {vertexesConfig.map(vertex => {
                return (
                  <div key={vertex.name}>
                    <p>{intl.get('import.vertexesFilePath')}</p>
                    <p>
                      {intl.get('import.vertexFilePath')}
                      <a href={vertex.file.path} target="__blank">
                        {vertex.name}
                      </a>
                    </p>
                    <p>
                      {intl.get('import.vertexErrorFilePath')}
                      <a
                        href={`${mountPath}/tmp/err/${vertex.name}Fail.scv`}
                        target="__blank"
                      >
                        {vertex.name}Fail.csv
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
                    <p>
                      {intl.get('import.edgeFilePath')}
                      <a href={edge.file.path} target="__blank">
                        {edge.name}
                      </a>
                    </p>
                    <p>
                      {intl.get('import.edgeErrorFilePath')}
                      <a
                        href={`${mountPath}/tmp/err/${edge.name}Fail.scv`}
                        target="__blank"
                      >
                        {edge.name}Fail.csv
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

export default connect(mapState, mapDispatch)(Import);
