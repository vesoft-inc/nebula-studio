import { Icon, Tooltip } from 'antd';
import React from 'react';

import './index.less';

const Instruction = (props: { description: string; onClick?: () => void }) => {
  return (
    <Tooltip title={props.description} placement="right">
      <Icon
        type="question-circle"
        className="icon-instruction"
        onClick={props.onClick}
      />
    </Tooltip>
  );
};

export default Instruction;
