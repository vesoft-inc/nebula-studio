import React, { useState } from 'react';
import classNames from 'classnames';
import Icon from '@app/components/Icon';
import { LinkObject, NodeObject } from '@app/components/ForceGraph';
import Expand from './ExpandForm';
import './index.less';


interface IProps {
  data: {
    nodes: NodeObject[],
    links: LinkObject[]
  }
  spaceVidType: string;
}

const DisplayPanel = (props: IProps) => {
  const [visible, setVisible] = useState(false);
  const { data, spaceVidType } = props;
  return (
    <div className="display-panel">
      <div className="btn-toggle-panel" onClick={() => setVisible(!visible)}>
        <Icon type="icon-studio-btn-back" />
      </div>
      <div className={classNames('display-drawer', { 'active': visible })}>
        <Expand data={data} spaceVidType={spaceVidType} />
      </div>
    </div>
  );
};

export default DisplayPanel;
