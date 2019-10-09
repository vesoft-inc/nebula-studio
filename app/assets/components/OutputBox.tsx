import { Tabs } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

interface IProps {
  value: string;
  onHistoryItem: () => void;
}

export default class OutputBox extends React.Component<IProps, {}> {
  constructor(props) {
    super(props);
  }

  render() {
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
              Table 1
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
