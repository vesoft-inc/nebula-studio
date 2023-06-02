import { Tooltip } from 'antd';
import { useState } from 'react';
import { useI18n } from '@vesoft-inc/i18n';
import Icon from '@app/components/Icon';
import styles from './index.module.less';

interface IProps {
  data: any;
  onSelect: (value: string) => void
}
const CypherParameterBox = (props: IProps) => {
  const { data, onSelect } = props;
  const [paramVisible, setParamVisible] = useState(false);
  const { intl } = useI18n();
  if(!paramVisible) {
    return <div className={styles.btnOpenParam} onClick={() => setParamVisible(true)}>
      <Icon type="icon-studio-btn-down" />
    </div>;
  }

  return <div className={styles.paramContainer}>
    <div className={styles.paramBox}>
      {Object.entries(data).map(([k, v]) => (
        <Tooltip title={JSON.stringify(v)} key={k}>
          <span className={styles.paramItem} onClick={() => onSelect(k)}>{k}</span>
        </Tooltip>
      ))}
    </div>
    <div className={styles.btnCloseBox} onClick={() => setParamVisible(false)}>
      <Icon type="icon-studio-btn-up" />
      {intl.get('console.cypherParam')}
    </div>
  </div>;
};
export default CypherParameterBox;
