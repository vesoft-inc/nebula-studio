import React from 'react';
import emptyImg from '@app/static/images/empty.png';
import styles from './index.module.less';

interface IProps {
  text: string,
  tip: string,
}
const EmptyTableTip = (props: IProps) => {
  const { text, tip } = props;
  return <div className={styles.emptyBox}>
    <img src={emptyImg} />
    {text && <p className={styles.noData}>{text}</p>}
    {tip && <span className={styles.emptyTip}>{tip}</span>}
  </div>;
};

export default EmptyTableTip;
