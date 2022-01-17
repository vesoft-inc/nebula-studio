import { Input } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

import './index.less';

interface IProps {
  onSearch: (value) => void;
}

const Search = (props: IProps) => {
  return (
    <div className="schema-list-search">
      <Input.Search
        allowClear={true}
        placeholder={intl.get('common.namePlaceholder')}
        onSearch={props.onSearch}
        style={{ width: 200 }}
      />
    </div>
  );
};

export default Search;
