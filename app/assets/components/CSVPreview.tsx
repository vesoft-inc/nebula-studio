import { Table } from 'antd';
import React from 'react';

import './CSVPreview.less';

interface IProps {
  close: () => void;
  file: any;
}

const CSVPreview = (props: IProps) => {
  const { content } = props.file;
  const csvData = content.split('\n').map(row => row.split(','));
  const columns = csvData.length
    ? csvData[0].map((_, index) => ({
        title: `column ${index + 1}`,
        dataIndex: index,
      }))
    : [];

  return (
    <div className="csv-preview">
      <Table
        dataSource={csvData}
        columns={columns}
        pagination={false}
        rowKey={(_, index) => index.toString()}
      />
    </div>
  );
};

export default CSVPreview;
