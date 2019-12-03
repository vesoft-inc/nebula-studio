import { Button, Table } from 'antd';
import React from 'react';

import { Modal } from '.';
import './CSVPreviewLink.less';

interface IProps {
  file: any;
  children: string;
}

class CSVPreviewLink extends React.PureComponent<IProps> {
  modalHandler;
  handleLinkClick = () => {
    if (this.modalHandler) {
      this.modalHandler.show();
    }
  };
  render() {
    const { content } = this.props.file;
    const csvData = content.split('\n').map(row => row.split(','));
    const columns = csvData.length
      ? csvData[0].map((_, index) => ({
          title: `column ${index + 1}`,
          dataIndex: index,
        }))
      : [];

    return (
      <>
        <Button type="link" onClick={this.handleLinkClick}>
          {this.props.children}
        </Button>
        <Modal
          handlerRef={handler => {
            this.modalHandler = handler;
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
      </>
    );
  }
}

export default CSVPreviewLink;
