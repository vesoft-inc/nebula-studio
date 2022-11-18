import React, { useState } from 'react';

import Icon from '@app/components/Icon';
import { convertBigNumberToString, removeNullCharacters } from '@app/utils/function';
import cls from 'classnames';
import { useI18n } from '@vesoft-inc/i18n';
import styles from './index.module.less';

interface IProps {
  data: any;
  title: string;
  index: number;
}

interface IProperty {
  data: {
    key: string,
    value: any,
  }
}


const EXPAND_NUM = 3;

const Property: React.FC<IProperty> = (props: IProperty) => {
  const { data } = props;
  const handleValueShow = data => {
    const { key, value } = data;
    if (typeof value === 'string') {
      if (key === 'VID' && data.vidType === 'INT64') {
        return value;
      } else {
        return JSON.stringify(value, (_, v) => {
          return removeNullCharacters(v);
        });
      }
    } else if (typeof value === 'boolean') {
      return value.toString();
    } else if (key === 'Tag' && key === 'Tag') {
      return value.join(' | ');
    } else {
      return convertBigNumberToString(value); 
    }
  };
  return <div className={styles.itemContent}>
    <span className={styles.itemKey}>{data.key} : </span>
    <span className={styles.itemValue}>{handleValueShow(data)}</span>
  </div>;
};


const RowItem = (props: IProps) => {
  const { data, title, index } = props;
  if(!data) {
    return null;
  }
  const { intl } = useI18n();
  const [dataUnfolded, setDataUnfoldedStatus] = useState(index === 0);
  const needUnfoldMore = data.length > EXPAND_NUM;
  const [hasUnfoldAll, setUnfoldAllStatus] = useState(false);
  return <div className={styles.displayRowItem}>
    <div
      className={cls(styles.itemHeader, styles.row)}
      onClick={() => setDataUnfoldedStatus(!dataUnfolded)}
    >
      {dataUnfolded ? <Icon type="icon-studio-btn-down" /> : <Icon type="icon-studio-btn-up" />}
      <span className={styles.displayHeaderTitle}>{title}</span>
    </div>
    {dataUnfolded && (
      <>
        {data.slice(0, EXPAND_NUM).map(item => <Property key={item.key} data={item} />)}
        {needUnfoldMore && (
          <>
            {hasUnfoldAll && data.slice(EXPAND_NUM).map(item => <Property key={item.key} data={item} />)}
            <div
              className={cls(styles.itemOperation, styles.row)}
              onClick={() => setUnfoldAllStatus(!hasUnfoldAll)}
            >
              {hasUnfoldAll ? <div className={styles.btnToggle}>
                <Icon type="icon-studio-btn-up" />
                <span>{intl.get('explore.collapseItem')}</span>
              </div> : <div className={styles.btnToggle}>
                <Icon type="icon-studio-btn-down" />
                <span>{intl.get('explore.expandItem')}</span>
              </div>}
            </div>
          </>
        )}
      </>
    )}
  </div>;
};


export default RowItem;
