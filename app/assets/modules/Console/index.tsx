import { Button, Icon, List, message, Modal } from 'antd';
import cookies from 'js-cookie';
import React from 'react';
import intl from 'react-intl-universal';
import { RouteComponentProps } from 'react-router-dom';
import { CodeMirror, OutputBox } from '../../components';
import service from '../../config/service';
import Command from '../Command';
import './index.less';

enum OutType {
  nGQL = 'NGQL',
  command = 'command',
}

interface IState {
  code: string;
  isUpDown: boolean;
  history: boolean;
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
    };
  }

  getLocalStorage = () => {
    const value: string | null = localStorage.getItem('history');
    if (value && value !== 'undefined' && value !== 'null') {
      return JSON.parse(value).reverse();
    }
    return [];
  }

  handleRun = async () => {
    const code = this.editor.getValue();
    if (!code) {
      message.error(intl.get('common.sorryNGQLCannotBeEmpty'));
      return;
    }
    const history = this.getLocalStorage().slice(0, 15);
    history.push(code);
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
      await this.runNGQL(code);
    }
  }

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
    const result = await service
      .execNGQL({
        username,
        password,
        host,
        gql: code,
      });
    this.setState({
      result,
      isUpDown: true,
    });
  }

  handleHistoryItem = (value: string) => {
    this.setState({
      code: value,
      outType: value[0] === ':' ? OutType.command : OutType.nGQL,
      history: false,
    });
  }

  getInstance = (instance) => {
    if (instance) {
      this.codemirror = instance.codemirror;
      this.editor = instance.editor;
    }
  }

  handleUpDown = () => {
    this.setState({
      isUpDown: !this.state.isUpDown,
    });
  }

  render() {
    const { isUpDown, code, history, result, outType } = this.state;

    return (
      <div className="nebula-console">
        <div className="ngql-content">
            <div className="mirror-wrap">
              <CodeMirror
                value={code}
                ref={this.getInstance}
                height={isUpDown ? '34px' : '600px'}
                options={{
                  keyMap: 'sublime',
                  fullScreen: true,
                  mode: 'nebula',
                }}
              />
              <div className="expand" onClick={this.handleUpDown}>
                {
                isUpDown ? <Icon type="down" /> : <Icon type="up" />
                }
              </div>
            </div>
            <Icon
              type="play-circle"
              onClick={() => this.handleRun()}
            />
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
          {
            outType === OutType.nGQL ? (
              <OutputBox
                result={result}
                value={this.getLocalStorage().pop()}
                onHistoryItem={(e) => this.handleHistoryItem(e)}
              />
            ) : (
              <Command command={code.substr(1)} />
            )
          }

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
              dataSource={this.getLocalStorage()}
              renderItem={(item: string) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => this.handleHistoryItem(item)}
                >
                  {item}
                </List.Item>
              )}
            />
          }
        </Modal>
      </div>
    );
  }
}
