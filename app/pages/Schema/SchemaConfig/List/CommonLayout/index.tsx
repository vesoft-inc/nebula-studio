import { Button, Table } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import Icon from '@app/components/Icon';
import EmptyTableTip from '@app/components/EmptyTableTip';
import Search from '../Search';
import styles from './index.module.less';

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
    <div className={styles.schemaConfigList}>
      <div className={styles.header}>
        <Button type="primary" className="studioAddBtn">
          <Link
            to={`/schema/${type}/create`}
            data-track-category="navigation"
            data-track-action={`view_${type}_create`}
            data-track-label={`from_${type}_list`}
          >
            <Icon className="studioAddBtnIcon" type="icon-studio-btn-add" />{intl.get('common.create')}
          </Link>
        </Button>
        <Search onSearch={onSearch} type={type.toLowerCase()} />
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
        locale={{ emptyText: <EmptyTableTip text={intl.get(`empty.${type}`)} tip={intl.get(`empty.${type}Tip`)} /> }}
      />
    </div>
  );
};

export default observer(CommonLayout);
