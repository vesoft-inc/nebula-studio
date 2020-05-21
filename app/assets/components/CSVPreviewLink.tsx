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

// TODO: move it into a npm package in future
function csvToArray(content, delimiter) {
  return content.split('\n').map((row: string) => {
    const cols = [] as string[];
    let isQuoteOpen = false;
    let isQuoteClose = false;
    const paddingRow = row + ',';
    for (let i = 0, j = 0, len = paddingRow.length; j < len; j++) {
      switch (paddingRow[j]) {
        case '"':
          if (!isQuoteOpen) {
            isQuoteOpen = true;
          } else {
            isQuoteClose = true;
          }
          break;
        case delimiter:
          if (!isQuoteOpen) {
            cols.push(paddingRow.substring(i, j));
            i = j + 1;
          } else if (isQuoteClose) {
            // value by quote
            cols.push(paddingRow.substring(i + 1, j - 1));
            i = j + 1;
            isQuoteClose = false;
            isQuoteOpen = false;
          }
          break;
      }
    }
    return cols;
  });
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
    const csvData = csvToArray(content, ',');
    const columns = csvData.length
      ? csvData[0].map((_, index) => {
          const textIndex = index;
          return {
            title: onMapping ? (
              <>
                <Button
                  type="primary"
                  className="csv-select-index"
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
