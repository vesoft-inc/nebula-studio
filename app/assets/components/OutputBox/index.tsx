import { Alert, Icon, Table, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

import { OutputCsv } from '#assets/components';

import './index.less';

interface IProps {
  value: string;
  result: any;
  onHistoryItem: (value: string) => void;
}

interface IState {
  sorter: any;
}

export default class OutputBox extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);

    this.state = {
      sorter: null,
    };
  }

  handleTableChange = (_1, _2, sorter) => {
    this.setState({
      sorter,
    });
  };

  outputClass = (code: any) => {
    if (code !== undefined) {
      if (code === 0) {
        return 'success';
      }
      return 'error';
    }
    return 'info';
  };

  render() {
    const { value, result = {} } = this.props;
    const { sorter } = this.state;
    let columns = [];
    let dataSource = [];
    if (result.code === 0) {
      if (result.data && result.data.headers) {
        columns = result.data.headers.map(column => {
          return {
            title: column,
            dataIndex: column,
            sorter: true,
            sortDirections: ['descend', 'ascend'],
          };
        });
      }

      if (result.data && result.data.tables) {
        dataSource = result.data.tables;
        if (sorter) {
          switch (sorter.order) {
            case 'descend':
              dataSource = result.data.tables.sort((r1, r2) => {
                const field = sorter.field;
                const v1 = r1[field];
                const v2 = r2[field];
                return v1 === v2 ? 0 : v1 < v2 ? 1 : -1;
              });
              break;
            case 'ascend':
              dataSource = result.data.tables.sort((r1, r2) => {
                const field = sorter.field;
                const v1 = r1[field];
                const v2 = r2[field];
                return v1 === v2 ? 0 : v1 > v2 ? 1 : -1;
              });
              break;
          }
        }
      }
    }
    return (
      <div className="output-box">
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
            {result.code === 0 && (
              <Tabs.TabPane
                tab={
                  <>
                    <Icon type="table" />
                    {intl.get('common.table')}
                  </>
                }
                key="table"
              >
                <div className="operation">
                  <OutputCsv
                    tableData={{
                      headers: result.data && result.data.headers,
                      tables: dataSource,
                    }}
                  />
                </div>
                <Table
                  bordered={true}
                  columns={columns}
                  dataSource={dataSource}
                  rowKey={(_, index) => index.toString()}
                  onChange={this.handleTableChange}
                />
              </Tabs.TabPane>
            )}
            {result.code === 0 && result.data.timeCost && (
              <Tabs.TabPane
                tab={
                  <>
                    <Icon type="clock-circle" />
                    {intl.get('console.cost')}
                  </>
                }
                key="cost"
              >
                {`${intl.get('console.execTime')} ${result.data.timeCost /
                  1000000} (s)`}
              </Tabs.TabPane>
            )}
            {result.code !== 0 && (
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
