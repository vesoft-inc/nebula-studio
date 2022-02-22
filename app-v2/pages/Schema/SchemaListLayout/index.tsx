import { Button, Table } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Link, useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Search from '../Search';

import './index.less';

interface IProps {
  onSearch: (value) => void;
  data: any;
  columns: any;
  loading: boolean;
  renderExpandInfo: (record) => any;
  children?: any
}
const SchemaListLayout = (props: IProps) => {
  const { onSearch, data, columns, loading, renderExpandInfo, children } = props;
  const { space, type } = useParams() as { space :string, type: string, module?: string };
  const [expandKeys, setExpandKeys] = useState<any[]>([]);
  const handleRowClick = row => {
    const { name: key } = row;
    const keys = expandKeys.includes(key) ? [] : [key];
    setExpandKeys(keys);
  };
  return (
    <div className="nebula-schema-config-list">
      <div className="header">
        <Button type="primary">
          <Link
            to={`/schema/${space}/${type}/create`}
            data-track-category="navigation"
            data-track-action={`view_${type}_create`}
            data-track-label={`from_${type}_list`}
          >
            + {intl.get('common.create')}
          </Link>
        </Button>
        <Search onSearch={onSearch} type={intl.get('common.edge').toLowerCase()} />
      </div>
      {children}
      <Table
        dataSource={data}
        columns={columns}
        expandable={{
          expandedRowRender: record => renderExpandInfo(record),
          expandRowByClick: true,
          expandedRowKeys: expandKeys,
          onExpand: (_, record) => handleRowClick(record)
        }}
        loading={loading}
        rowKey="name"
      />
    </div>
  );
};

export default observer(SchemaListLayout);
