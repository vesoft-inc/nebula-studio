import { Button, Table } from 'antd';
import React from 'react';

import { Modal } from '.';
import './CSVPreviewLink.less';

interface IProps {
  file: any;
  children: string;
}

const CSVPreviewLink = (props: IProps) => {
  const { content } = props.file;
  const csvData = content.split('\n').map(row => row.split(','));
  const columns = csvData.length
    ? csvData[0].map((_, index) => ({
        title: `column ${index + 1}`,
        dataIndex: index,
      }))
    : [];
  let modalHandler = null as any;

  return (
    <Button
      type="link"
      onClick={() => {
        if (modalHandler) {
          modalHandler.show();
        }
      }}
    >
      {props.children}
      <Modal
        handlerRef={handler => {
          modalHandler = handler;
        }}
        footer={false}
        width={800}
      >
        <div className="csv-preview">
          <Table
            dataSource={csvData}
            columns={columns}
            pagination={false}
            rowKey={(_, index) => index.toString()}
          />
        </div>
      </Modal>
    </Button>
  );
};

export default CSVPreviewLink;
