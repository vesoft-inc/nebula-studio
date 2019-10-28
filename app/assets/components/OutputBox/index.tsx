import { Alert, Icon, Table, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';
import './index.less';

interface IProps {
  value: string;
  result: any;
  onHistoryItem: (value: string) => void;
}

export default class OutputBox extends React.Component<IProps, {}> {
  constructor(props) {
    super(props);
  }

  outputClass = (code: any) => {
    if (code !== undefined) {
      if (code === '0') {
        return 'success';
      }
      return 'error';
    }
    return 'info';
  };

  render() {
    const { value, result = {} } = this.props;
    let columns = [];
    let dataSource = [];
    if (result.code === '0') {
      if (result.data && result.data.headers) {
        columns = result.data.headers.map(column => {
          return {
            title: column,
            dataIndex: column,
          };
        });
      }

      if (result.data && result.data.tables) {
        dataSource = result.data.tables;
      }
    }
    return (
      <div className="output-box">
        {/* <p
          className={`output-value ${this.outputClass(result.code)}`}
          onClick={() => this.props.onHistoryItem(value)}
        >
          $ {value}
        </p> */}
        <Alert
          message={
            <p className="gql" onClick={() => this.props.onHistoryItem(value)}>
              $ {value}
            </p>
          }
          className="output-value"
          type={this.outputClass(result.code)}
        />
        <div className="tab-container">
          <Tabs defaultActiveKey={'log'} size={'large'} tabPosition={'left'}>
            {result.code === '0' && (
              <Tabs.TabPane
                tab={
                  <>
                    <Icon type="table" />
                    {intl.get('common.table')}
                  </>
                }
                key="table"
              >
                <Table
                  bordered={true}
                  columns={columns}
                  dataSource={dataSource}
                />
              </Tabs.TabPane>
            )}
            {result.code !== '0' && (
              <Tabs.TabPane
                tab={
                  <>
                    <Icon type="alert" />
                    {intl.get('common.log')}
                  </>
                }
                key="log"
              >
                {result.message}
              </Tabs.TabPane>
            )}
          </Tabs>
        </div>
      </div>
    );
  }
}
