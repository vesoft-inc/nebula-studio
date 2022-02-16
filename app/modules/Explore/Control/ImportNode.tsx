import { Tabs } from 'antd';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';

import AlgorithmQuery from './AlgorithmQuery';
import CustomQuery from './CustomQuery';
import IdQuery from './IdQuery';
import IndexQuery from './IndexQuery';

interface IProps {
  handler: any;
}

interface IState {
  loading: boolean;
}

class ImportNodes extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      loading: false,
    };
  }

  render() {
    return (
      <Tabs defaultActiveKey={'id'}>
        <Tabs.TabPane tab={intl.get('explore.queryById')} key="id">
          <IdQuery closeHandler={this.props.handler.hide} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get('explore.queryByIndex')} key="index">
          <IndexQuery closeHandler={this.props.handler.hide} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get('explore.graphAlgorithm')} key="algorithm">
          <AlgorithmQuery closeHandler={this.props.handler.hide} />
        </Tabs.TabPane>
        <Tabs.TabPane tab={intl.get('explore.queryByCustom')} key="custom">
          <CustomQuery />
        </Tabs.TabPane>
      </Tabs>
    );
  }
}

export default ImportNodes;
