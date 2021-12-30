import { Button, Icon, List, message, Modal, Tooltip } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { CodeMirror, OutputBox } from '#assets/components';
import { maxLineNum } from '#assets/config/nebulaQL';
import { IDispatch, IRootState } from '#assets/store';
import { trackPageView } from '#assets/utils/stat';

import './index.less';
import SpaceSearchInput from './SpaceSearchInput';

interface IState {
  isUpDown: boolean;
  history: boolean;
  visible: boolean;
}

const mapState = (state: IRootState) => ({
  result: state._console.result,
  currentGQL: state._console.currentGQL,
  paramsMap: state._console.paramsMap,
  currentSpace: state.nebula.currentSpace,
  runGQLLoading: state.loading.effects._console.asyncRunGQL,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncRunGQL: dispatch._console.asyncRunGQL,
  asyncGetParams: dispatch._console.asyncGetParams,
  updateCurrentGQL: gql =>
    dispatch._console.update({
      currentGQL: gql,
    }),
  asyncSwitchSpace: async space => {
    await dispatch.nebula.asyncSwitchSpace(space);
    await dispatch.explore.clear();
  },
});

interface IProps
  extends ReturnType<typeof mapState>,
    ReturnType<typeof mapDispatch>,
    RouteComponentProps {}

// split from semicolon out of quotation marks
const SEMICOLON_REG = /((?:[^;'"]*(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')[^;'"]*)+)|;/;
class Console extends React.Component<IProps, IState> {
  codemirror;
  editor;

  constructor(props: IProps) {
    super(props);

    this.state = {
      isUpDown: true,
      history: false,
      visible: false,
    };
  }

  componentDidMount() {
    trackPageView('/console');
    this.props.asyncGetParams();
  }

  getLocalStorage = () => {
    const value: string | null = localStorage.getItem('history');
    if (value && value !== 'undefined' && value !== 'null') {
      return JSON.parse(value).slice(-15);
    }
    return [];
  };

  handleSaveQuery = (query: string) => {
    if (query !== '') {
      const history = this.getLocalStorage();
      history.push(query);
      localStorage.setItem('history', JSON.stringify(history));
    }
  };

  checkSwitchSpaceGql = (query: string) => {
    const queryList = query.split(SEMICOLON_REG).filter(Boolean);
    const reg = /^USE `?[0-9a-zA-Z_]+`?(?=[\s*;?]?)/gim;
    if (queryList.some(sentence => sentence.trim().match(reg))) {
      return intl.get('common.disablesUseToSwitchSpace');
    }
  };
  handleRun = async () => {
    const query = this.editor.getValue();
    if (!query) {
      message.error(intl.get('common.sorryNGQLCannotBeEmpty'));
      return;
    }
    const errInfo = this.checkSwitchSpaceGql(query);
    if (errInfo) {
      return message.error(errInfo);
    }

    this.editor.execCommand('goDocEnd');
    this.handleSaveQuery(query);
    await this.props.asyncRunGQL(query);
    this.setState({
      isUpDown: true,
    });
  };

  handleHistoryItem = (value: string) => {
    this.props.updateCurrentGQL(value);
    this.setState({
      history: false,
    });
  };

  handleEmptyNgqlHistory = () => {
    localStorage.setItem('history', 'null');
    this.setState({
      history: false,
    });
  };

  handleEmptyNgql = () => {
    this.props.updateCurrentGQL('');
    this.forceUpdate();
  };

  getInstance = instance => {
    if (instance) {
      this.codemirror = instance.codemirror;
      this.editor = instance.editor;
    }
  };

  handleUpDown = () => {
    this.setState({
      isUpDown: !this.state.isUpDown,
    });
  };

  handleLineCount = () => {
    let line;
    if (this.editor.lineCount() > maxLineNum) {
      line = maxLineNum;
    } else if (this.editor.lineCount() < 5) {
      line = 5;
    } else {
      line = this.editor.lineCount();
    }
    this.editor.setSize(undefined, line * 24 + 10 + 'px');
  };

  historyListShow = (str: string) => {
    if (str.length < 300) {
      return str;
    }
    return str.substring(0, 300) + '...';
  };

  toggleDrawer = () => {
    const { visible } = this.state;
    this.setState({
      visible: !visible,
    });
  };

  render() {
    const { isUpDown, history } = this.state;
    const {
      currentSpace,
      currentGQL,
      result,
      runGQLLoading,
      paramsMap,
    } = this.props;
    return (
      <div className="nebula-console padding-page">
        <div className="ngql-content">
          <div className="mirror-wrap">
            <div className="mirror-nav">
              {intl.get('common.currentSpace')}:
              <SpaceSearchInput
                onSpaceChange={this.props.asyncSwitchSpace}
                value={currentSpace}
              />
              <Tooltip title={intl.get('common.spaceTip')} placement="right">
                <Icon type="question-circle" theme="outlined" />
              </Tooltip>
              <div className="operation">
                <Tooltip title={intl.get('common.empty')} placement="bottom">
                  <Icon type="delete" onClick={this.handleEmptyNgql} />
                </Tooltip>
                <Tooltip
                  title={intl.get('common.seeTheHistory')}
                  placement="bottom"
                >
                  <Icon
                    type="history"
                    onClick={() => {
                      this.setState({ history: true });
                    }}
                  />
                </Tooltip>
                <Tooltip title={intl.get('common.run')} placement="bottom">
                  {!!runGQLLoading ? (
                    <Icon type="loading" />
                  ) : (
                    <Icon
                      type="play-circle"
                      theme="twoTone"
                      onClick={() => this.handleRun()}
                    />
                  )}
                </Tooltip>
              </div>
            </div>
            <div className="mirror-content">
              <Tooltip
                title={intl.get('console.parameterDisplay')}
                placement="right"
              >
                <Icon
                  type="file-search"
                  className="btn-drawer"
                  onClick={this.toggleDrawer}
                />
              </Tooltip>
              {this.state.visible && (
                <div className="param-box">
                  {Object.entries(paramsMap).map(([k, v]) => (
                    <p key={k}>{`${k} => ${JSON.stringify(v)}`}</p>
                  ))}
                </div>
              )}
              <CodeMirror
                value={currentGQL}
                onBlur={value => this.props.updateCurrentGQL(value)}
                onChangeLine={this.handleLineCount}
                ref={this.getInstance}
                height={isUpDown ? '240px' : 24 * maxLineNum + 'px'}
                onShiftEnter={this.handleRun}
                options={{
                  keyMap: 'sublime',
                  fullScreen: true,
                  mode: 'nebula',
                }}
              />
            </div>
          </div>
        </div>
        <div className="result-wrap">
          <OutputBox
            result={result}
            value={this.getLocalStorage().pop()}
            onHistoryItem={e => this.handleHistoryItem(e)}
          />
        </div>
        <Modal
          title={
            <div>
              <span className="history-title">
                {intl.get('common.NGQLHistoryList')}
              </span>
              <Button type="link" onClick={this.handleEmptyNgqlHistory}>
                {intl.get('console.deleteHistory')}
              </Button>
            </div>
          }
          visible={history}
          className="historyList"
          footer={null}
          onCancel={() => {
            this.setState({ history: false });
          }}
        >
          {
            <List
              itemLayout="horizontal"
              dataSource={this.getLocalStorage().reverse()}
              renderItem={(item: string) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  className="history-list"
                  onClick={() => this.handleHistoryItem(item)}
                >
                  {this.historyListShow(item)}
                </List.Item>
              )}
            />
          }
        </Modal>
      </div>
    );
  }
}

export default connect(mapState, mapDispatch)(Console);
