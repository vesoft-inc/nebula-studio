import { Button, Popover, Table } from 'antd';
import { } from 'antd/lib/button';
import React, { useState } from 'react';
import intl from 'react-intl-universal';
import { v4 as uuidv4 } from 'uuid';
import cls from 'classnames';
import styles from './index.module.less';

interface IProps {
  file: any;
  children: any;
  onMapping?: (index) => void;
  btnType?: string
  selected?: boolean
}

const CSVPreviewLink = (props: IProps) => {
  const { onMapping, file: { content }, children, btnType, selected } = props;
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
            className={styles.csvSelectIndex}
            onClick={() => handleMapping(textIndex)}
          >{`column ${textIndex}`}</Button>
        ) : (
          `Column ${textIndex}`
        ),
        dataIndex: index,
        render: value => <span className={styles.limitWidth}>{value}</span>,
      };
    })
    : [];
  return (
    <Popover
      destroyTooltipOnHide={true}
      overlayClassName={styles.popoverPreview}
      visible={visible}
      trigger="click"
      arrowPointAtCenter
      onVisibleChange={visible => setVisible(visible)}
      content={<div className={styles.csvPreview}>
        <Table
          className={cls({ [styles.noBackground]: !!onMapping })}
          dataSource={content}
          columns={columns}
          pagination={false}
          rowKey={() => uuidv4()}
        />
        <div className={styles.operation}>
          {onMapping && (
            <Button onClick={() => handleMapping(null)}>
              {intl.get('import.ignore')}
            </Button>
          )}
        </div>
      </div>}
    >
      <Button type="link" className={cls(styles.btnPreview, { 'primaryBtn': btnType === 'default', [styles.btnActived]: selected })} onClick={handleLinkClick}>
        {children}
      </Button>
    </Popover>
  );
};

export default CSVPreviewLink;
