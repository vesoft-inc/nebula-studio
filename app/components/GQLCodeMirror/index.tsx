import { Collapse } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

import CodeMirror from '@app/components/CodeMirror';

import './index.less';
const Panel = Collapse.Panel;
interface IOptions {
  [propName: string]: any;
}
const GQLCodeMirror = (props: { currentGQL: string; option?: IOptions }) => {
  const options = {
    keyMap: 'sublime',
    fullScreen: true,
    mode: 'nebula',
    readOnly: true,
    ...props.option,
  };
  return (
    <Collapse className="export-gql">
      <Panel header={intl.get('common.exportNGQL')} key="ngql">
        <CodeMirror value={props.currentGQL} options={options} height="80px" />
      </Panel>
    </Collapse>
  );
};

export default GQLCodeMirror;
