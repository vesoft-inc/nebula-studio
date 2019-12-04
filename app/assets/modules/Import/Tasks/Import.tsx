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
}

class Import extends React.Component<IProps, IState> {
  ref: HTMLDivElement;
  log: any;
  constructor(props: IProps) {
    super(props);
    this.state = {
      activeKey: 'log',
    };
  }

  handleRunImport = () => {
    this.props.importData({
      config: '/Users/lidanji/Vesoft/local/config.yaml',
      localDir: '/Users/lidanji/Vesoft/local/',
    });
    this.log = setInterval(this.redalog, 3000);
  };

  redalog = async () => {
    const { importLoading } = this.props;
    const result = await service.readLog({
      localDir: '/Users/lidanji/Vesoft/local/',
    });
    this.ref.innerHTML = result.data;
    this.ref.scrollTop = this.ref.scrollHeight;
    if (!importLoading) {
      clearInterval(this.log);
    }
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
    const { activeKey } = this.state;
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
            <Button className="import-again" onClick={this.props.nextStep}>
              {intl.get('import.newImport')}
            </Button>
            <Button className="import-again" onClick={this.handleAgainImport}>
              {intl.get('import.againImport')}
            </Button>
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
