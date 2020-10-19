import { Collapse } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

import { CodeMirror } from '#assets/components';

import './index.less';
const Panel = Collapse.Panel;
interface IOptions {
  [propName: string]: string;
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
        <CodeMirror value={props.currentGQL} options={options} />
      </Panel>
    </Collapse>
  );
};

export default GQLCodeMirror;
