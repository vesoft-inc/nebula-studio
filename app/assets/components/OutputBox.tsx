import { Table, Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

interface IProps {
  value: string;
  data: any[];
  onHistoryItem: (value: string) => void;
}

interface IState {
  dataSource: any[];
  columns: any[];
}

export default class OutputBox extends React.Component<IProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      columns: [],
      dataSource: [],
    };
  }

  getColumns = (data: any[]) => {
    const columns: any[] = [];
    data.forEach((value: string) => {
      columns.push({
        title: value,
        dataIndex: value,
      });
    });
    return columns;
  }

  getDataSource = (data: any[]) => {
    const dataSource: any[] = [];
    data.forEach((value: any, index: number) => {
      value.key = index;
      dataSource.push(value);
    });
    return dataSource;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data.data) {
      this.setState({
        columns: this.getColumns(nextProps.data.data.headers),
        dataSource: this.getDataSource(nextProps.data.data.tables),
      });
    }
  }

  render() {
    const { columns, dataSource } = this.state;
    console.log(columns, dataSource);
    return (
      <div className="output-box">
        <p
          className="output-value"
          onClick={() => this.props.onHistoryItem(this.props.value)}
        >
          {this.props.value}
        </p>
        <div className="tab-container">
          <Tabs defaultActiveKey="1" size={'large'}>
            <Tabs.TabPane tab={intl.get('common.Table')} key="1">
              <Table columns={columns} dataSource={dataSource} />
            </Tabs.TabPane>
            <Tabs.TabPane tab={intl.get('common.Log')} key="2">
              Log 2
            </Tabs.TabPane>
            <Tabs.TabPane tab={intl.get('common.Record')} key="3">
              Record 3
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    );
  }
}
