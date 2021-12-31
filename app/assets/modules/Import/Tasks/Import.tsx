import { Button, Input, message, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';

import { Modal } from '#assets/components';
import service from '#assets/config/service';
import { IDispatch, IRootState } from '#assets/store';
import { configToJson, getStringByteLength } from '#assets/utils/import';
import { trackEvent, trackPageView } from '#assets/utils/stat';

import './Import.less';
import Prev from './Prev';
const { TabPane } = Tabs;
const mapState = (state: IRootState) => ({
  activeStep: state.importData.activeStep,
  importLoading: state.loading.effects.importData.importData,
  taskDir: state.importData.taskDir,
  isImporting: state.importData.isImporting,
  vertexesConfig: state.importData.vertexesConfig,
  edgesConfig: state.importData.edgesConfig,
  taskId: state.importData.taskId,
  currentSpace: state.nebula.currentSpace,
  username: state.nebula.username,
  host: state.nebula.host,
  spaceVidType: state.nebula.spaceVidType,
});

const mapDispatch = (dispatch: IDispatch) => ({
  importData: dispatch.importData.importData,
  resetAllConfig: dispatch.importData.resetAllConfig,
  update: dispatch.importData.update,
  stopImport: dispatch.importData.stopImport,
  checkImportStatus: dispatch.importData.checkImportStatus,
});

type IProps = ReturnType<typeof mapState> & ReturnType<typeof mapDispatch>;

interface IState {
  activeKey: string;
  password: string;
  startByte: number;
  endByte: number;
}

enum ITaskStatus {
  'statusFinished' = 'statusFinished',
  'statusStoped' = 'statusStoped',
  'statusProcessing' = 'statusProcessing',
  'statusNotExisted' = 'statusNotExisted',
  'statusAborted' = 'statusAborted',
}

class Import extends React.Component<IProps, IState> {
  ref: HTMLDivElement;
  logTimer: any;
  checkTimer: any;
  modalHandle;

  constructor(props: IProps) {
    super(props);
    this.state = {
      activeKey: 'log',
      startByte: 0,
      endByte: 1000000,
      password: '',
    };
  }

  componentDidMount() {
    trackPageView('/import/data');
  }

  componentWillUnmount() {
    clearTimeout(this.logTimer);
  }

  createConfigFile = async () => {
    const {
      currentSpace,
      username,
      host,
      vertexesConfig,
      edgesConfig,
      taskDir,
      activeStep,
      spaceVidType,
    } = this.props;
    const { password } = this.state;
    const config: any = configToJson({
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      taskDir,
      activeStep,
      spaceVidType,
    });
    const res = await service.createConfigFile({
      config,
      mountPath: taskDir,
    });
    if (res.code !== 0) {
      message.error(intl.get('import.createConfigError'));
    }
  };

  handleRunImport = async () => {
    const {
      currentSpace,
      username,
      host,
      vertexesConfig,
      edgesConfig,
      taskDir,
      activeStep,
    } = this.props;
    const { password } = this.state;
    this.ref.innerHTML = '';
    const errCode: any = await this.props.importData({
      currentSpace,
      username,
      password,
      host,
      vertexesConfig,
      edgesConfig,
      taskDir,
      activeStep,
    });
    if (errCode === 0) {
      this.logTimer = setTimeout(this.readlog, 3000);
      this.checkTimer = setTimeout(this.checkIsFinished, 2000);
    }
    trackEvent('import', 'import_data', 'start');
  };

  handleOpen = () => {
    if (this.modalHandle) {
      this.modalHandle.show();
      this.setState({ password: '' });
    }
  };
  handleClose = () => {
    if (this.modalHandle) {
      this.modalHandle.hide();
    }
  };

  checkIsFinished = async () => {
    const { taskId } = this.props;
    const { code, data, message: errMsg } = await this.props.checkImportStatus({
      taskID: taskId,
      taskAction: 'actionQuery',
    });
    if (code !== 0) {
      message.warning(errMsg);
      return;
    }

    const result = data.results?.[0];
    if (result?.taskStatus !== ITaskStatus.statusProcessing) {
      if (result.taskMessage) {
        message.warning(result.taskMessage);
      }
      if (result?.taskStatus === ITaskStatus.statusFinished) {
        message.success(intl.get('import.importFinished'));
      }
      service.finishImport({ taskId });
      clearTimeout(this.checkTimer);
    } else {
      this.checkTimer = setTimeout(this.checkIsFinished, 2000);
    }
  };

  readlog = async () => {
    const { startByte, endByte } = this.state;
    const { taskDir, taskId, update } = this.props;
    const result: any = await service.getLog({
      dir: taskDir,
      startByte,
      endByte,
      taskId,
    });
    const byteLength = result.data ? getStringByteLength(result.data) : 0;
    if (result.data && result.code === 0) {
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
      if (result.code === 0) {
        this.logTimer = setTimeout(this.readlog, 2000);
      } else {
        this.setState({
          startByte: 0,
          endByte: 1000000,
        });
        update({
          isImporting: false,
        });
        clearTimeout(this.logTimer);
        trackEvent('import', 'import_data', 'finish');
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

  handleImportStart = async () => {
    this.handleClose();
    await this.createConfigFile();
    await this.handleRunImport();
  };

  render() {
    const {
      isImporting,
      vertexesConfig,
      edgesConfig,
      taskDir,
      taskId,
    } = this.props;
    const { activeKey, password } = this.state;
    return (
      <div className="import">
        <div className="import-btn">
          <Button
            className="import-again"
            onClick={this.handleOpen}
            loading={isImporting}
          >
            {intl.get('import.runImport')}
          </Button>
          <Button
            className="import-again"
            onClick={() =>
              this.props.stopImport({
                taskID: taskId,
                taskAction: 'actionStop',
              })
            }
            disabled={!isImporting}
          >
            {intl.get('import.endImport')}
          </Button>
          <Prev disabled={isImporting} />
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
              disabled={isImporting}
            >
              {intl.get('import.newImport')}
            </Button>
            <div className="import-export">
              <div>
                {intl.get('import.configFile')}
                <a href={`${taskDir}/config.yaml`} target="__blank">
                  config.yaml
                </a>
              </div>
              <div>
                {intl.get('import.logFile')}
                <a href={`${taskDir}/import.log`} target="__blank">
                  import.log
                </a>
              </div>
              <br />
              {vertexesConfig.map(vertex => {
                return (
                  <div key={vertex.name}>
                    <p>{intl.get('import.vertexesFile')}</p>
                    <p>
                      {intl.get('import.vertexFile')}
                      <a href={vertex.file.path} target="__blank">
                        {vertex.name}
                      </a>
                    </p>
                    <p>
                      {intl.get('import.vertexErrorFile')}
                      <a
                        href={`${taskDir}/err/${vertex.name}Fail.csv`}
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
                        href={`${taskDir}/err/${edge.name}Fail.csv`}
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
        <Modal
          title={intl.get('import.enterPassword')}
          className="password-modal"
          handlerRef={handle => (this.modalHandle = handle)}
          footer={false}
        >
          <Input.Password
            onChange={e => this.setState({ password: e.target.value })}
          />
          <div className="btns">
            <Button onClick={this.handleClose}>
              {intl.get('common.cancel')}
            </Button>
            <Button
              type="primary"
              disabled={!password}
              onClick={this.handleImportStart}
            >
              {intl.get('common.confirm')}
            </Button>
          </div>
        </Modal>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Import);
