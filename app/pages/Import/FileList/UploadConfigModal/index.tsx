import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import { Button, Checkbox, Input, Modal, Table, Popconfirm, Dropdown } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { usePapaParse } from 'react-papaparse';
import cls from 'classnames';
import { StudioFile } from '@app/interfaces/import';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useBatchState } from '@app/utils';
import styles from './index.module.less';
interface IProps {
  visible: boolean;
  onConfirm: (files: StudioFile[]) => void
  onCancel: () => void;
  fileList: StudioFile[];
}

const DelimiterConfigModal = (props: { onConfirm: (string) => void }) => {
  const { intl } = useI18n();
  const [value, setValue] = useState('');
  return (
    <div className={styles.delimiterConfigContainer}>
      <span className={styles.title}>{intl.get('common.value')}</span>
      <Input className={styles.input} value={value} onChange={(e) => setValue(e.target.value)} placeholder={intl.get('import.enterDelimiter')} />
      <Button className={cls('primaryBtn', styles.btn)} onClick={() => props.onConfirm(value)}>{intl.get('import.applicateToAll')}</Button>
    </div>
  );
};
const UploadConfigModal = (props: IProps) => {
  const { visible, onConfirm, onCancel, fileList } = props;
  const { intl } = useI18n();
  const { state, setState } = useBatchState({
    data: [],
    activeItem: null,
    previewContent: [],
    checkAll: false,
    indeterminate: false,
    loading: false,
    uploading: false,
    previewColumn: []
  });
  const { uploading, data, activeItem, previewContent, checkAll, indeterminate, loading } = state;
  const { readRemoteFile } = usePapaParse();
  useEffect(() => {
    if (activeItem) {
      readFile(activeItem);
    }
  }, [activeItem]);
  const readFile = (file) => {
    if(!file) return;
    setState({ loading: true });
    const url = URL.createObjectURL(file);
    let content = [];
    readRemoteFile(url, { 
      delimiter: file.delimiter, 
      download: true, 
      preview: 5,
      worker: true, 
      step: (row) => {
        content = [...content, row.data];
      },
      complete: () => {
        setState({ loading: false, previewContent: content });
      } 
    });
  };
  const init = () => {
    setState({ data: fileList, activeItem: fileList[0] });
  };
  useEffect(() => {
    visible && init();
  }, [visible]);
  const onCheckAllChange = (e: CheckboxChangeEvent) => {
    const { checked } = e.target;
    data.forEach(item => item.withHeader = checked);
    setState({
      checkAll: checked,
      indeterminate: false,
      data: [...data]
    });
  };

  const updateItem = (e: CheckboxChangeEvent, item: StudioFile) => {
    e.stopPropagation();
    const { checked } = e.target;
    item.withHeader = checked;
    const checkedList = state.data.filter((file) => file.withHeader);
    setState({
      checkAll: checkedList.length === data.length,
      indeterminate: !!checkedList.length && checkedList.length < data.length,
    });
    
  };
  const deletePreviewFile = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const isActive = activeItem.uid === data[index].uid;
    const newData = [...data];
    newData.splice(index, 1);
    const checkedList = newData.filter((file) => file.withHeader);
    setState({
      checkAll: checkedList.length === newData.length,
      indeterminate: !!checkedList.length && checkedList.length < newData.length,
      data: newData,
      activeItem: isActive ? null : activeItem,
      previewContent: isActive ? [] : previewContent,
    });
  };

  const updateDelimiter = (e: React.ChangeEvent<HTMLInputElement>, item: StudioFile) => {
    e.stopPropagation();
    item.delimiter = e.target.value;
    item === activeItem && readFile(item);
  };

  const updateAllDelimiter = (value: string) => {
    data.forEach(item => item.delimiter = value);
    readFile(activeItem);
  };

  const columns = [
    {
      title: intl.get('import.fileName'),
      dataIndex: 'name',
      align: 'center' as const,
      width: '30%'
    },
    {
      title: <>
        <Checkbox checked={checkAll} indeterminate={indeterminate} onChange={onCheckAllChange} />
        <span style={{ paddingLeft: '5px' }}>{intl.get('import.withHeader')}</span>
      </>,
      key: 'withHeader',
      width: '30%',
      render: record => <Checkbox checked={record.withHeader} onChange={e => updateItem(e, record)}>{intl.get('import.hasHeader')}</Checkbox>,
    },
    {
      title: <>
        <span>{intl.get('import.delimiter')}</span>
        <Dropdown trigger={['hover']} overlay={<DelimiterConfigModal onConfirm={updateAllDelimiter} />} placement="bottomLeft">
          <Icon className={styles.btnMore} type="icon-studio-more" />
        </Dropdown>
      </>,
      key: 'delimiter',
      width: '30%',
      render: record => <Input value={record.delimiter} placeholder="," onChange={e => updateDelimiter(e, record)} />,
    },
    {
      key: 'operation',
      align: 'center' as const,
      render: (_, _file, index) => (
        <div className={styles.operation}>
          <Popconfirm
            onConfirm={(e) => deletePreviewFile(e, index)}
            title={intl.get('common.ask')}
            okText={intl.get('common.ok')}
            cancelText={intl.get('common.cancel')}
          >
            <Button className="warningBtn" type="link" onClick={e => e.stopPropagation()}>
              <Icon type="icon-studio-btn-delete" />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];
  const parseColumns = previewContent.length
    ? previewContent[0].map((header, index) => {
      const textIndex = index;
      const title = activeItem?.withHeader ? header : `Column ${textIndex}`;
      return {
        title,
        dataIndex: index,
        render: value => <span className={styles.limitWidth}>{value}</span>,
      };
    })
    : [];
  const handleConfirm = async () => {
    setState({ uploading: true });
    await onConfirm(data);
    setState({ uploading: true });
    onCancel();
  };
  const handleCancel = () => {
    !uploading && onCancel();
  };

  if(!visible) {
    return null;
  }

  return (
    <Modal
      title={intl.get('import.previewFiles')}
      open={visible}
      width={920}
      onCancel={() => handleCancel()}
      className={styles.previewModal}
      footer={false}
    >
      <div className={styles.container}>
        <div className={styles.left}>
          <Table
            size="small"
            onRow={record => {
              return {
                onClick: () => setState({ activeItem: record }), 
              };
            }}
            rowClassName={record => {
              return record === activeItem ? styles.active : styles.defaultRow;
            }}
            className={styles.previewTable}
            dataSource={data}
            columns={columns}
            rowKey="uid"
            pagination={false}
          />
        </div>
        <div className={styles.right}>
          <span className={styles.sampleTitle}>
            <span className={styles.label}>{intl.get('import.sampleData')}</span>
            <span className={styles.filename}>{activeItem?.name}</span>
          </span>
          <Table
            loading={loading}
            className={styles.sampleTable}
            dataSource={activeItem?.withHeader ? previewContent.slice(1) : previewContent}
            columns={parseColumns}
            pagination={false}
            rowKey={() => uuidv4()}
          />
        </div>
      </div>
      <div className={styles.btns}>
        <Button disabled={uploading} onClick={() => handleCancel()}>
          {intl.get('common.cancel')}
        </Button>
        <Button
          type="primary"
          loading={uploading}
          onClick={() => handleConfirm()}
        >
          {intl.get('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
};

export default UploadConfigModal;
