import { Button, Popover, Table } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@vesoft-inc/i18n';
import { v4 as uuidv4 } from 'uuid';
import cls from 'classnames';
import { usePapaParse } from 'react-papaparse';
import { StudioFile } from '@app/interfaces/import';
import { CheckOutlined } from '@ant-design/icons';
import styles from './index.module.less';

interface IProps {
  file: StudioFile;
  children: any;
  onMapping?: (index: number[] | number) => void;
  btnType?: string;
  selected?: boolean;
  multipleMode?: boolean;
  data: number[] | number;
}

const CSVPreviewLink = (props: IProps) => {
  const { onMapping, file, children, btnType, selected, multipleMode, data } = props;
  const [visible, setVisible] = useState(false);
  const [datasource, setDatasource] = useState<any[]>([]);
  const { intl } = useI18n();
  const { readString } = usePapaParse();
  const [indexes, setIndexes] = useState<number[]>([]);
  useEffect(() => {
    if (!file) return;
    const { delimiter, sample } = file;
    let data = [];
    readString(sample, {
      delimiter,
      worker: true,
      skipEmptyLines: true,
      step: (row) => {
        data = [...data, row.data];
      },
      complete: () => {
        setDatasource(data);
      },
    });
  }, [file]);

  useEffect(() => {
    setIndexes(data ? (Array.isArray(data) ? data : [data]) : []);
  }, [data]);
  const handleLinkClick = useCallback((e) => {
    e.stopPropagation();
    setVisible(true);
  }, []);
  const handleMapping = useCallback(
    (e) => {
      e.stopPropagation();
      onMapping?.(multipleMode ? indexes : indexes[0]);
      setVisible(false);
    },
    [indexes, onMapping],
  );
  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      onMapping?.(null);
      setVisible(false);
      setIndexes([]);
    },
    [onMapping],
  );

  const toggleMapping = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!multipleMode) {
        setIndexes([index]);
        return;
      }
      const _indexes = [...indexes];
      if (indexes.indexOf(index) > -1) {
        _indexes.splice(indexes.indexOf(index), 1);
      } else {
        _indexes.push(index);
      }
      setIndexes(_indexes);
    },
    [multipleMode, indexes],
  );

  const columns =
    datasource[0]?.map((header, index) => {
      const textIndex = index;
      const _header = file?.withHeader ? header : `Column ${textIndex}`;
      const isSelected = indexes.indexOf(textIndex) > -1;
      return {
        title: onMapping ? (
          <Button
            type={isSelected ? 'primary' : 'default'}
            className={styles.csvSelectIndex}
            onClick={(e) => toggleMapping(textIndex, e)}
          >
            {isSelected && <CheckOutlined />}
            {_header}
          </Button>
        ) : (
          _header
        ),
        dataIndex: index,
        render: (value) => <span className={styles.limitWidth}>{value}</span>,
      };
    }) || [];
  const handleOpen = useCallback(
    (visible) => {
      if (!file) return;
      setVisible(visible);
    },
    [file],
  );
  return (
    <Popover
      destroyTooltipOnHide={true}
      overlayClassName={styles.popoverPreview}
      open={visible}
      trigger="click"
      arrow
      onOpenChange={handleOpen}
      content={
        <div className={styles.csvPreview}>
          <p className={styles.selectTitle}>{intl.get('import.selectCsvColumn')}</p>
          <Table
            bordered={false}
            className={cls({ [styles.noBackground]: !!onMapping })}
            dataSource={file?.withHeader ? datasource.slice(1) : datasource}
            columns={columns}
            pagination={false}
            rowKey={() => uuidv4()}
          />
          <div className={styles.operation}>
            {onMapping && (
              <>
                <Button onClick={handleClear} className="primaryBtn studioAddBtn">
                  {intl.get('import.ignore')}
                </Button>
                <Button type="primary" onClick={handleMapping} className={styles.confirmBtn}>
                  {intl.get('common.confirm')}
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <Button
        type="link"
        disabled={!file}
        className={cls(styles.btnPreview, { primaryBtn: btnType === 'default', [styles.btnActived]: selected })}
        onClick={handleLinkClick}
      >
        {children}
      </Button>
    </Popover>
  );
};

export default CSVPreviewLink;
