import { Button, Icon, Input, List, message, Modal, Tooltip } from 'antd';
import cookies from 'js-cookie';
import React from 'react';
import intl from 'react-intl-universal';
import { RouteComponentProps } from 'react-router-dom';

import { CodeMirror, OutputBox } from '#assets/components';
import { maxLineNum } from '#assets/config/nebulaQL';
import service from '#assets/config/service';
import { trackEvent, trackPageView } from '#assets/utils/stat';

import Command from './Command';
import './index.less';

enum OutType {
  nGQL = 'NGQL',
  command = 'command',
}

interface IState {
  code: string;
  isUpDown: boolean;
  history: boolean;
  space: string;
  result: any;
  outType: OutType;
}

type IProps = RouteComponentProps;

export default class Console extends React.Component<IProps, IState> {
  codemirror;
  editor;

  constructor(props: IProps) {
    super(props);

    this.state = {
      result: {},
      code: 'SHOW SPACES;',
      isUpDown: true,
      history: false,
      outType: OutType.nGQL,
      space: '',
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
    const { space } = this.state;
    const code = this.editor.getValue();
    const completeCode = space ? `use ${space};${code}` : code;
    if (!code) {
      message.error(intl.get('common.sorryNGQLCannotBeEmpty'));
      return;
    }
    this.editor.execCommand('goDocEnd');
    const history = this.getLocalStorage();
    history.push(completeCode);
    localStorage.setItem('history', JSON.stringify(history));

    if (code.length && code.trim()[0] === ':') {
      this.setState({
        outType: OutType.command,
        code,
      });
    } else {
      this.setState({
        outType: OutType.nGQL,
        code,
      });
      await this.runNGQL(completeCode);
    }

    trackEvent('console', 'run');
  };

  runNGQL = async (code: string) => {
    const username = cookies.get('username');
    const password = cookies.get('password');
    const host = cookies.get('host');
    if (!username || !password || !host) {
      message.warning(intl.get('warning.configServer'));
      this.setState({
        code: ':config server',
        outType: OutType.command,
      });
      return;
    }
    const result = await service.execNGQL({
      username,
      password,
      host,
      gql: code,
    });
    this.setState({
      result,
      isUpDown: true,
    });
  };

  handleHistoryItem = (value: string) => {
    let code = value;
    let space = '';
    if (value.includes('use')) {
      const str = value.split(';', 1)[0];
      space = str.substring(4);
      code = value.substring(str.length + 1);
    }
    this.setState({
      code,
      space,
      outType: value[0] === ':' ? OutType.command : OutType.nGQL,
      history: false,
    });
  };

  handleEmptyNgql = () => {
    this.setState({
      code: '',
    });
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

  handleChangeSpace = e => {
    this.setState({
      space: e.target.value,
    });
  };

  render() {
    const { isUpDown, code, history, result, outType, space } = this.state;
    return (
      <div className="nebula-console">
        <div className="ngql-content">
          <div className="mirror-wrap">
            <div className="mirror-nav">
              USE:
              <Input
                onChange={this.handleChangeSpace}
                value={space}
                placeholder="space name"
              />
              <Tooltip title={intl.get('common.spaceTip')} placement="right">
                <Icon type="question-circle" theme="outlined" />
              </Tooltip>
            </div>
            <CodeMirror
              value={code}
              onChangeLine={this.handleLineCount}
              ref={this.getInstance}
              height={isUpDown ? '120px' : 24 * maxLineNum + 'px'}
              options={{
                keyMap: 'sublime',
                fullScreen: true,
                mode: 'nebula',
              }}
            />
            {/*<div className="expand" onClick={this.handleUpDown}>
                {
                  isUpDown ? <Icon type="down" /> : <Icon type="up" />
                }
              </div>*/}
          </div>
          <Tooltip title={intl.get('common.empty')} placement="bottom">
            <Icon type="edit" onClick={() => this.handleEmptyNgql()} />
          </Tooltip>
          <Tooltip title={intl.get('common.run')} placement="bottom">
            <Icon type="play-circle" onClick={() => this.handleRun()} />
          </Tooltip>
        </div>
        <div className="result-wrap">
          <Button
            className="ngql-history"
            type="primary"
            onClick={() => {
              this.setState({ history: true });
            }}
          >
            {intl.get('common.seeTheHistory')}
          </Button>
          {outType === OutType.nGQL ? (
            <OutputBox
              result={result}
              value={this.getLocalStorage().pop()}
              onHistoryItem={e => this.handleHistoryItem(e)}
            />
          ) : (
            <Command command={code.substr(1)} />
          )}
        </div>
        <Modal
          title={intl.get('common.NGQLHistoryList')}
          visible={history}
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
