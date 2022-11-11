import { Input } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@vesoft-inc/i18n';
import { SearchOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

import { debounce } from 'lodash';
import styles from './index.module.less';

interface IProps {
  onSearch: (value) => void;
  type: string;
}

const Search = (props: IProps) => {
  const { onSearch, type } = props;
  const { intl } = useI18n();
  const location = useLocation();
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
  }, [location.pathname]);
  const onChange = useCallback(e => {
    setValue(e.target.value);
    search(e.target.value);
  }, []);
  const search = useCallback(debounce((value) => {
    onSearch(value);
  }, 500), []);

  return (
    <div className={styles.schemaSearch}>
      <Input
        value={value}
        prefix={<SearchOutlined className={styles.inputSearch} onClick={() => onSearch(value)} />}
        allowClear={true}
        placeholder={intl.get('common.namePlaceholder', { name: type })}
        onChange={onChange}
        onPressEnter={() => onSearch(value)}
        style={{ width: 300 }}
        suffix={null}
      />
    </div>
  );
};

export default Search;
