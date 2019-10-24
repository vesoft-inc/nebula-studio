import { Table, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

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
        return 'output-success';
      }
      return 'output-error';
    }
    return '';
  }

  render() {
    const { value, result= {} } = this.props;
    let columns = [];
    let dataSource = [];
    if (result.code === '0') {
      if (result.data && result.data.headers) {
        columns = result.data.headers.map((column) => {
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
        <p
          className={`output-value ${this.outputClass(result.code)}`}
          onClick={() => this.props.onHistoryItem(value)}
        >
          $ {value}
        </p>
        <div className="tab-container">
          <Tabs defaultActiveKey={'log'} size={'large'} tabPosition={'left'}>
            {result.code === '0' && <Tabs.TabPane tab={intl.get('common.table')} key="table">
              <Table columns={columns} dataSource={dataSource} />
            </Tabs.TabPane>}
            {result.code !== '0' && <Tabs.TabPane tab={intl.get('common.log')} key="log">
              {result.message}
            </Tabs.TabPane>}
            {/* <Tabs.TabPane tab={intl.get('common.record')} key="3">
              Record 3
            </Tabs.TabPane> */}
          </Tabs>
        </div>
      </div>
    );
  }
}
