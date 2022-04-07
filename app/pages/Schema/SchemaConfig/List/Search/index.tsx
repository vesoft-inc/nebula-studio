import { Input } from 'antd';
import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { SearchOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

import styles from './index.module.less';

interface IProps {
  onSearch: (value) => void;
  type: string;
}

const Search = (props: IProps) => {
  const { onSearch, type } = props;
  const location = useLocation();
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
  }, [location.pathname]);
  return (
    <div className={styles.schemaSearch}>
      <Input
        value={value}
        prefix={<SearchOutlined className={styles.inputSearch} onClick={() => onSearch(value)} />}
        allowClear={true}
        placeholder={intl.get('common.namePlaceholder', { name: type })}
        onChange={e => setValue(e.target.value)}
        onPressEnter={() => onSearch(value)}
        style={{ width: 300 }}
        suffix={null}
      />
    </div>
  );
};

export default Search;
