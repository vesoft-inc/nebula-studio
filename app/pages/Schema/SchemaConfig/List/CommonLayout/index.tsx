import { Button, Table } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Icon from '@app/components/Icon';
import Search from '../Search';
import './index.less';

interface IProps {
  onSearch: (value) => void;
  data: any;
  columns: any;
  loading: boolean;
  renderExpandInfo: (record) => any;
  children?: any;
  type: string
}
const CommonLayout = (props: IProps) => {
  const { onSearch, data, columns, loading, renderExpandInfo, children, type } = props;
  const [expandKeys, setExpandKeys] = useState<any[]>([]);
  const handleRowClick = row => {
    const { name: key } = row;
    const keys = expandKeys.includes(key) ? [] : [key];
    setExpandKeys(keys);
  };
  return (
    <div className="nebula-schema-config-list">
      <div className="header">
        <Button type="primary" className="studio-add-btn">
          <Link
            to={`/schema/${type}/create`}
            data-track-category="navigation"
            data-track-action={`view_${type}_create`}
            data-track-label={`from_${type}_list`}
          >
            <Icon className="studio-add-btn-icon" type="icon-studio-btn-add" />{intl.get('common.create')}
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

export default observer(CommonLayout);
