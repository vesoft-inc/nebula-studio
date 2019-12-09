import { Button, Icon, Table, Tooltip } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

import { Modal } from '.';
import './CSVPreviewLink.less';

interface IProps {
  file: any;
  children: string;
  onMapping?: (index) => void;
  prop?: string;
}

class CSVPreviewLink extends React.PureComponent<IProps> {
  modalHandler;
  handleLinkClick = () => {
    if (this.modalHandler) {
      this.modalHandler.show();
    }
  };

  handleMapping = index => {
    if (this.props.onMapping) {
      this.props.onMapping(index);
      this.modalHandler.hide();
    }
  };
  render() {
    const { onMapping, prop } = this.props;
    const { content } = this.props.file;
    const csvData = content.split('\n').map(row => row.split(','));
    const columns = csvData.length
      ? csvData[0].map((_, index) => {
          const textIndex = index + 1;
          return {
            title: onMapping ? (
              <>
                <Button
                  type="link"
                  onClick={() => this.handleMapping(textIndex)}
                >{`column ${textIndex}`}</Button>
                <Tooltip
                  title={intl.get('import.setMappingTip', {
                    prop,
                    index: textIndex,
                  })}
                >
                  <Icon type="info-circle" />
                </Tooltip>
              </>
            ) : (
              `column ${textIndex}`
            ),
            dataIndex: index,
          };
        })
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
              bordered={true}
              dataSource={csvData}
              columns={columns}
              pagination={false}
              rowKey={(_, index) => index.toString()}
            />
            <div className="operation">
              {onMapping && (
                <Button onClick={() => this.handleMapping(null)}>
                  {intl.get('import.ignore')}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      </>
    );
  }
}

export default CSVPreviewLink;
