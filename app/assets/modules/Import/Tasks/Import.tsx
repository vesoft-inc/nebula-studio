import { Button, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import service from '#assets/config/service';
import { IDispatch } from '#assets/store';

const { TabPane } = Tabs;
const mapState = (state: any) => ({
  currentStep: state.importData.currentStep,
  importLoading: state.loading.effects.importData.importData,
});

const mapDispatch = (dispatch: IDispatch) => ({
  importData: dispatch.importData.importData,
  nextStep: dispatch.importData.nextStep,
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

interface IState {
  activeKey: string;
  isFinish: boolean;
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
      isFinish: true,
      startByte: 0,
      endByte: 1000000,
    };
  }

  endImport = () => {
    service.deleteProcess();
    this.setState({
      isFinish: true,
    });
  };

  handleRunImport = () => {
    this.setState({
      isFinish: false,
    });
    this.props.importData({
      config: '/Users/lidanji/Vesoft/local/config.yaml',
      localDir: '/Users/lidanji/Vesoft/local/',
    });
    this.logTimer = setTimeout(this.readlog, 1000);
    this.finishTimer = setInterval(this.refresh, 1000);
  };

  refresh = async () => {
    const result = await service.refresh();
    if (result.data) {
      this.setState({
        isFinish: true,
      });
      clearInterval(this.finishTimer);
    }
  };

  readlog = async () => {
    const { startByte, endByte } = this.state;
    const result: any = await service.getLog({
      dir: '/Users/lidanji/Vesoft/local/',
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
    const { activeKey, isFinish } = this.state;
    return (
      <div className="import">
        <div className="imprt-btn">
          <Button onClick={this.handleRunImport}>
            {intl.get('import.runImport')}
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
            {!isFinish && (
              <Button className="import-again" onClick={this.endImport}>
                {intl.get('import.endImport')}
              </Button>
            )}
            {isFinish && (
              <Button className="import-again" onClick={this.props.nextStep}>
                {intl.get('import.newImport')}
              </Button>
            )}
            {isFinish && (
              <Button className="import-again" onClick={this.handleAgainImport}>
                {intl.get('import.againImport')}
              </Button>
            )}
            <div className="import-export">
              <div>
                配置文件（本地路径 /Users/lidanji/Vesoft/local/config.yaml ）：
                <a href="file:///Users/lidanji/Vesoft/local/config.yaml">
                  config.yml
                </a>
              </div>
              <div>
                导入数据错误的节点文件（本地路径
                /Users/lidanji/Vesoft/local/err/vertexFail.yaml ）：
                <a href="file:///Users/lidanji/Vesoft/local/err/vertexFail.csv">
                  vertexFail.csv
                </a>
              </div>
              <div>
                导入数据错误的边文件（本地路径
                /Users/lidanji/Vesoft/local/err/edgeFail.yaml ）：
                <a href="file:///Users/lidanji/Vesoft/local/err/edgeFail.csv">
                  edgeFail.csv
                </a>
              </div>
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
