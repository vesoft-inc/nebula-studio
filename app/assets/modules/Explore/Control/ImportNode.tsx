import { Form, Tabs } from 'antd';
import { FormComponentProps } from 'antd/lib/form/Form';
import _ from 'lodash';
import React from 'react';
import intl from 'react-intl-universal';

import CustomQuery from './CustomQuery';
import IdQuery from './IdQuery';
import IndexQuery from './IndexQuery';

interface IProps extends FormComponentProps {
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
        <Tabs.TabPane tab={intl.get('explore.queryByCustom')} key="custom">
          <CustomQuery />
        </Tabs.TabPane>
      </Tabs>
    );
  }
}

export default Form.create<IProps>()(ImportNodes);
