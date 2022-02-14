import { Button, Popover, Table } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import './index.less';
import { v4 as uuidv4 } from 'uuid';

interface IProps {
  file: any;
  children: string;
  onMapping?: (index) => void;
}

const CSVPreviewLink = (props: IProps) => {
  const { onMapping, file: { content }, children } = props;
  const [visible, setVisible] = useState(false);
  const handleLinkClick = e => {
    e.stopPropagation();
    setVisible(true);
  };

  const handleMapping = index => {
    onMapping && onMapping(index);
    setVisible(false);
  };
  const columns = content.length
    ? content[0].map((_, index) => {
      const textIndex = index;
      return {
        title: onMapping ? (
          <Button
            type="primary"
            className="csv-select-index"
            onClick={() => handleMapping(textIndex)}
          >{`column ${textIndex}`}</Button>
        ) : (
          `Column ${textIndex}`
        ),
        dataIndex: index,
      };
    })
    : [];
  return (
    <Popover
      destroyTooltipOnHide={true}
      overlayClassName="popover-preview"
      visible={visible}
      trigger="click"
      onVisibleChange={visible => setVisible(visible)}
      content={<div className="csv-preview">
        <Table
          bordered={true}
          dataSource={content}
          columns={columns}
          pagination={false}
          rowKey={() => uuidv4()}
        />
        <div className="operation">
          {onMapping && (
            <Button onClick={() => handleMapping(null)}>
              {intl.get('import.ignore')}
            </Button>
          )}
        </div>
      </div>}
    >
      <Button type="link" className="btn-preview" onClick={handleLinkClick}>
        {children}
      </Button>
    </Popover>
  );
};

export default CSVPreviewLink;
