import { Button, Popover, Table } from 'antd';
import { } from 'antd/lib/button';
import React, { useState } from 'react';
import { useI18n } from '@vesoft-inc/i18n';
import { v4 as uuidv4 } from 'uuid';
import cls from 'classnames';
import styles from './index.module.less';

interface IProps {
  file: any;
  children: any;
  onMapping?: (index: number, e: React.MouseEvent) => void;
  btnType?: string
  selected?: boolean
}

const CSVPreviewLink = (props: IProps) => {
  const { onMapping, file, children, btnType, selected } = props;
  const [visible, setVisible] = useState(false);
  const { intl } = useI18n();
  const handleLinkClick = e => {
    e.stopPropagation();
    setVisible(true);
  };
  const handleMapping = (index: number, e: React.MouseEvent) => {
    onMapping && onMapping(index, e);
    setVisible(false);
  };
  const columns = file?.content?.length
    ? file.content[0].map((_, index) => {
      const textIndex = index;
      return {
        title: onMapping ? (
          <Button
            type="primary"
            className={styles.csvSelectIndex}
            onClick={(e) => handleMapping(textIndex, e)}
          >{`column ${textIndex}`}</Button>
        ) : (
          `Column ${textIndex}`
        ),
        dataIndex: index,
        render: value => <span className={styles.limitWidth}>{value}</span>,
      };
    })
    : [];
  const handleOpen = (visible) => {
    if(!file) return;
    setVisible(visible);
  };
  return (
    <Popover
      destroyTooltipOnHide={true}
      overlayClassName={styles.popoverPreview}
      open={visible}
      trigger="click"
      arrowPointAtCenter
      onOpenChange={handleOpen}
      content={<div className={styles.csvPreview}>
        <Table
          className={cls({ [styles.noBackground]: !!onMapping })}
          dataSource={file?.content || []}
          columns={columns}
          pagination={false}
          rowKey={() => uuidv4()}
        />
        <div className={styles.operation}>
          {onMapping && (
            <Button onClick={(e) => handleMapping(null, e)}>
              {intl.get('import.ignore')}
            </Button>
          )}
        </div>
      </div>}
    >
      <Button type="link" disabled={!file} className={cls(styles.btnPreview, { 'primaryBtn': btnType === 'default', [styles.btnActived]: selected })} onClick={handleLinkClick}>
        {children}
      </Button>
    </Popover>
  );
};

export default CSVPreviewLink;
