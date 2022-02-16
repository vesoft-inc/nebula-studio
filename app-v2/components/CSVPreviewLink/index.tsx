import { Button, Table, Tooltip, Modal } from 'antd';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import './index.less';
import { InfoCircleOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

interface IProps {
  file: any;
  children: string;
  onMapping?: (index) => void;
  prop?: string;
  centered?: boolean
}

const CSVPreviewLink = (props: IProps) => {
  const { onMapping, prop, file: { content }, children, centered } = props;
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const handleLinkClick = e => {
    setPosition({
      x: e.clientX,
      y: e.clientY,
    })
    e.stopPropagation()
    setVisible(true)
  };

  const handleMapping = index => {
    onMapping && onMapping(index)
    setVisible(false)
  };
  const columns = content.length
      ? content[0].map((_, index) => {
        const textIndex = index;
        return {
          title: onMapping ? (
            <>
              <Button
                type="primary"
                className="csv-select-index"
                onClick={() => handleMapping(textIndex)}
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
      <Button type="link" className='btn-preview' onClick={handleLinkClick}>
        {children}
      </Button>
      <Modal
        className='preview-modal'
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={false}
        mask={false}
        style={centered ? undefined : { top: position.y || undefined, left: position.x || undefined, margin: 0}}
      >
        <div className="csv-preview">
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
        </div>
      </Modal>
    </>
  );
}

export default CSVPreviewLink;
