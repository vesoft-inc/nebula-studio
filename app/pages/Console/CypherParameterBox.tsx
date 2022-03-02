import { Tooltip } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import Icon from '@app/components/Icon';
import './index.less';

interface IProps {
  data: any;
  onSelect: (value: string) => void
}
const CypherParameterBox = (props: IProps) => {
  const { data, onSelect } = props;
  const [paramVisible, setParamVisible] = useState(false);

  if(!paramVisible) {
    return <div className="btn-open-param" onClick={() => setParamVisible(true)}>
      <Icon type="icon-studio-btn-down" />
    </div>;
  }

  return <div className="param-container">
    <div className="param-box">
      {Object.entries(data).map(([k, v]) => (
        <Tooltip title={JSON.stringify(v)} key={k}>
          <span className="param-item" onClick={() => onSelect(k)}>{k}</span>
        </Tooltip>
      ))}
    </div>
    <div className="btn-close-box" onClick={() => setParamVisible(false)}>
      <Icon type="icon-studio-btn-up" />
      {intl.get('console.cypherParam')}
    </div>
  </div>;
};
export default CypherParameterBox;
