import React, { useState } from 'react';
import intl from 'react-intl-universal';

import Icon from '@app/components/Icon';
import { convertBigNumberToString, removeNullCharacters } from '@app/utils/function';

import './index.less';

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
  return <div className="item-content">
    <span className="item-key">{data.key} : </span>
    <span className="item-value">{handleValueShow(data)}</span>
  </div>;
};


const RowItem = (props: IProps) => {
  const { data, title, index } = props;
  if(!data) {
    return null;
  }
  const [dataUnfolded, setDataUnfoldedStatus] = useState(index === 0);
  const needUnfoldMore = data.length > EXPAND_NUM;
  const [hasUnfoldAll, setUnfoldAllStatus] = useState(false);
  return <div className="display-row-item">
    <div
      className="item-header row"
      onClick={() => setDataUnfoldedStatus(!dataUnfolded)}
    >
      {dataUnfolded ? <Icon type="icon-studio-btn-down" /> : <Icon type="icon-studio-btn-up" />}
      <span className="display-header-title">{title}</span>
    </div>
    {dataUnfolded && (
      <>
        {data.slice(0, EXPAND_NUM).map(item => <Property key={item.key} data={item} />)}
        {needUnfoldMore && (
          <>
            {hasUnfoldAll && data.slice(EXPAND_NUM).map(item => <Property key={item.key} data={item} />)}
            <div
              className="item-operation row"
              onClick={() => setUnfoldAllStatus(!hasUnfoldAll)}
            >
              {hasUnfoldAll ? <div className="btn-toggle">
                <Icon type="icon-studio-btn-up" />
                <span>{intl.get('explore.collapseItem')}</span>
              </div> : <div className="btn-toggle">
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
