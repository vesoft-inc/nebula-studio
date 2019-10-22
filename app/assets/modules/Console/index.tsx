import { Button, Icon, List, message, Modal } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import { RouteComponentProps } from 'react-router-dom';
import { CodeMirror, OutputBox } from '../../components';
import service from '../../config/service';
import './index.less';

interface IState {
  code: string;
  isUpDown: boolean;
  history: boolean;
  result: any;
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
    };
  }

  getLocalStorage = () => {
    const value: string | null = localStorage.getItem('history');
    if (value && value !== 'undefined' && value !== 'null') {
      return JSON.parse(value);
    }
    return [];
  }

  handleRunNgql = () => {
    const code = this.editor.getValue();
    if (!code) {
      message.error(intl.get('common.sorryNGQLCannotBeEmpty'));
      return;
    }
    const history = this.getLocalStorage().slice(-15);
    history.push(code);
    localStorage.setItem('history', JSON.stringify(history));

    service
      .execNGQL({
        username: 'user',
        password: 'password',
        host: '127.0.0.1:3699',
        gql: code,
      })
      .then((res) => {
        this.setState({
          code,
          result: res.data,
          isUpDown: true,
        });
      });
  }

  handleHistoryItem = (value: string) => {
    this.setState({
      code: value,
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
    const { isUpDown, code, history, result } = this.state;

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
              onClick={() => this.handleRunNgql()}
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
          <OutputBox
            result={result}
            value={this.getLocalStorage().pop()}
            onHistoryItem={(e) => this.handleHistoryItem(e)}
          />
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
