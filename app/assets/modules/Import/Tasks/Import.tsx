import { Button, message, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import service from '#assets/config/service';
import { IDispatch } from '#assets/store';

const { TabPane } = Tabs;
const mapState = (state: any) => ({
  currentStep: state.importData.currentStep,
  importLoading: state.loading.effects.importData.importData,
  mountPath: state.importData.mountPath,
  isFinish: state.importData.isFinish,
  vertexesConfig: state.importData.vertexesConfig,
  edgesConfig: state.importData.edgesConfig,
  currentSpace: state.nebula.currentSpace,
  username: state.nebula.username,
  password: state.nebula.password,
  host: state.nebula.host,
});

const mapDispatch = (dispatch: IDispatch) => ({
  importData: dispatch.importData.importData,
  nextStep: dispatch.importData.nextStep,
  asyncCheckFinish: dispatch.importData.asyncCheckFinish,
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
  finishTimer: any;

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
      currentStep,
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
        currentStep,
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

  endImport = () => {
    service.deleteProcess();
  };

  handleRunImport = () => {
    const { mountPath } = this.props;
    this.props.importData({ localPath: mountPath });
    this.logTimer = setTimeout(this.readlog, 1000);
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
    const { startByte, endByte } = this.state;
    const { mountPath } = this.props;
    const result: any = await service.getLog({
      dir: mountPath,
      startByte,
      endByte,
    });
    if (result.data && result.code === '0') {
      this.setState(
        {
          startByte: endByte,
          endByte: endByte + 1000000,
        },
        () => {
          this.logTimer = setTimeout(this.readlog, 1000);
        },
      );
      this.ref.innerHTML = result.data;
    } else {
      if (result.code === '0') {
        this.logTimer = setTimeout(this.readlog, 1000);
      } else {
        this.setState({
          startByte: 0,
          endByte: 1000000,
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
            onClick={this.endImport}
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
              onClick={this.props.nextStep}
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
                配置文件：(/Users/lidanji/Vesoft/local/config.yaml) ：
                <a href={`file://${mountPath}/config.yaml`}>config.yml</a>
              </div>
              {vertexesConfig.map(vertex => {
                return (
                  <div key={vertex.name}>
                    <p>导入数据节点文件：</p>
                    {`本地数据文件路径： ${
                      vertex.file.path
                    } 错误数据文件路径： ${mountPath}/err/${
                      vertex.name
                    }Fail.scv`}
                    ：
                    <a href={`file://${mountPath}/err/${vertex.name}Fail.scv`}>
                      {vertex.name}
                    </a>
                  </div>
                );
              })}
              {edgesConfig.map(edge => {
                return (
                  <div key={edge.name}>
                    <p>导入数据边文件：</p>
                    {`本地数据文件路径： ${
                      edge.file.path
                    } 错误数据文件路径： ${mountPath}/err/${edge.name}Fail.scv`}
                    ：
                    <a href={`file://${mountPath}/err/${edge.name}Fail.scv`}>
                      {edge.name}
                    </a>
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
