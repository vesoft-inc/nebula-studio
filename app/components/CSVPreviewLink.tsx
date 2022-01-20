import { Button, Table, Tooltip } from 'antd';
import React from 'react';
import intl from 'react-intl-universal';

import { Modal } from '.';
import './CSVPreviewLink.less';
import { InfoCircleOutlined } from '@ant-design/icons';

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
    const columns = content.length
      ? content[0].map((_, index) => {
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
                <InfoCircleOutlined />
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
          width={1000}
        >
          <div className="csv-preview">
            <Table
              bordered={true}
              dataSource={content}
              columns={columns}
              pagination={false}
              rowKey={(_, index) => index!.toString()}
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
