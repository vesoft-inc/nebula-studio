import { Tooltip } from 'antd';
import Icon from '@app/components/Icon';
import React from 'react';

import './index.less';

const Instruction = (props: { description: string; onClick?: () => void }) => {
  return (
    <Tooltip title={props.description} placement="right">
      <Icon
        type="icon-studio-nav-help"
        className="studioIconInstruction"
        onClick={props.onClick}
      />
    </Tooltip>
  );
};

export default Instruction;
