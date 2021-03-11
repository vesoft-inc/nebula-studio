import { Button, Icon, List, message, Modal, Tooltip } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { CodeMirror, OutputBox } from '#assets/components';
import { maxLineNum } from '#assets/config/nebulaQL';
import { IDispatch, IRootState } from '#assets/store';
import { trackEvent, trackPageView } from '#assets/utils/stat';

import './index.less';
import SpaceSearchInput from './SpaceSearchInput';

interface IState {
  isUpDown: boolean;
  history: boolean;
}

const mapState = (state: IRootState) => ({
  result: state.console.result,
  currentGQL: state.console.currentGQL,
  currentSpace: state.nebula.currentSpace,
  runGQLLoading: state.loading.effects.console.asyncRunGQL,
});

const mapDispatch = (dispatch: IDispatch) => ({
  asyncRunGQL: dispatch.console.asyncRunGQL,
  updateCurrentGQL: gql =>
    dispatch.console.update({
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

class Console extends React.Component<IProps, IState> {
  codemirror;
  editor;

  constructor(props: IProps) {
    super(props);

    this.state = {
      isUpDown: true,
      history: false,
    };
  }

  componentDidMount() {
    trackPageView('/console');
  }

  getLocalStorage = () => {
    const value: string | null = localStorage.getItem('history');
    if (value && value !== 'undefined' && value !== 'null') {
      return JSON.parse(value).slice(-15);
    }
    return [];
  };

  handleRun = async () => {
    const gql = this.editor.getValue();
    if (!gql) {
      message.error(intl.get('common.sorryNGQLCannotBeEmpty'));
      return;
    }
    const reg = /(?<=[;?\s*]?)(?<![0-9a-zA-Z])USE `?[0-9a-zA-Z_]+`?(?=[\s*;?]?)/gm;
    const _gql = gql.replace(/[\r\n]/g, '').toUpperCase();
    // TODO this reg cannot avoid all situations like string vid fetch prop on * 'Fuse s'
    if (_gql.match(reg)) {
      return message.error(intl.get('common.disablesUseToSwitchSpace'));
    }
    this.editor.execCommand('goDocEnd');
    const history = this.getLocalStorage();
    history.push(gql);
    localStorage.setItem('history', JSON.stringify(history));

    await this.props.asyncRunGQL(gql);
    this.setState({
      isUpDown: true,
    });
    trackEvent('console', 'run_code');
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

  render() {
    const { isUpDown, history } = this.state;
    const { currentSpace, currentGQL, result, runGQLLoading } = this.props;
    return (
      <div className="nebula-console">
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
            <CodeMirror
              value={currentGQL}
              onBlur={value => this.props.updateCurrentGQL(value)}
              onChangeLine={this.handleLineCount}
              ref={this.getInstance}
              height={isUpDown ? '120px' : 24 * maxLineNum + 'px'}
              onShiftEnter={this.handleRun}
              options={{
                keyMap: 'sublime',
                fullScreen: true,
                mode: 'nebula',
              }}
            />
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
