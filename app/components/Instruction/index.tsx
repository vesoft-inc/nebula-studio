import { Tooltip } from 'antd';
import React from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';

import './index.less';

const Instruction = (props: { description: string; onClick?: () => void }) => {
  return (
    <Tooltip title={props.description} placement="right">
      <QuestionCircleOutlined
        className="icon-instruction"
        onClick={props.onClick}
      />
    </Tooltip>
  );
};

export default Instruction;
