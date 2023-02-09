import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import { Button, Checkbox, Input, Modal, Table, Popconfirm, Dropdown } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePapaParse } from 'react-papaparse';
import cls from 'classnames';
import { StudioFile } from '@app/interfaces/import';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useBatchState } from '@app/utils';
import { useStore } from '@app/stores';
import { observer } from 'mobx-react-lite';
import { ExclamationCircleFilled } from '@ant-design/icons';
import styles from './index.module.less';
interface IProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  uploadList: StudioFile[];
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
  const { visible, onConfirm, onCancel, uploadList } = props;
  const { files } = useStore();
  const { fileList, uploadFile } = files;
  const { intl } = useI18n();
  const { state, setState } = useBatchState({
    data: [],
    activeItem: null,
    previewContent: [],
    checkAll: false,
    indeterminate: false,
    loading: false,
    uploading: false,
  });
  const { uploading, data, activeItem, previewContent, checkAll, indeterminate, loading } = state;
  const { readRemoteFile } = usePapaParse();
  useEffect(() => {
    visible && setState({ data: uploadList, activeItem: uploadList[0] });
  }, [visible]);
  useEffect(() => {
    if (activeItem) {
      readFile(activeItem);
    }
  }, [activeItem]);
  const readFile = useCallback((file) => {
    if(!file) return;
    setState({ loading: true });
    const url = URL.createObjectURL(file);
    let content = [];
    readRemoteFile(url, { 
      delimiter: file.delimiter, 
      download: true, 
      preview: 5,
      worker: true, 
      skipEmptyLines: true,
      step: (row) => {
        content = [...content, row.data];
      },
      complete: () => {
        setState({ loading: false, previewContent: content });
      } 
    });
  }, []);
 
  const onCheckAllChange = useCallback((e: CheckboxChangeEvent) => {
    const { checked } = e.target;
    data.forEach(item => item.withHeader = checked);
    setState({
      checkAll: checked,
      indeterminate: false,
      data: [...data]
    });
  }, [data]);

  const updateItem = useCallback((e: CheckboxChangeEvent, item: StudioFile) => {
    e.stopPropagation();
    const { checked } = e.target;
    item.withHeader = checked;
    const checkedNum = data.reduce((n, file) => n + (file.withHeader & 1), 0);
    setState({
      checkAll: checkedNum === data.length,
      indeterminate: !!checkedNum && checkedNum < data.length,
    });
  }, [data]);
  const deletePreviewFile = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const isActive = activeItem.uid === data[index].uid;
    const newData = data.filter((_, i) => i !== index);
    const checkedNum = data.reduce((n, file) => n + (file.withHeader & 1), 0);
    setState({
      checkAll: checkedNum === newData.length,
      indeterminate: !!checkedNum && checkedNum < newData.length,
      data: newData,
      activeItem: isActive ? null : activeItem,
      previewContent: isActive ? [] : previewContent,
    });
  }, [activeItem, data]);

  const updateDelimiter = useCallback((e: React.ChangeEvent<HTMLInputElement>, item: StudioFile) => {
    e.stopPropagation();
    item.delimiter = e.target.value;
    item === activeItem && readFile(item);
  }, [activeItem]);

  const updateAllDelimiter = useCallback((value: string) => {
    data.forEach(item => item.delimiter = value);
    readFile(activeItem);
  }, [data, activeItem]);

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
            okText={intl.get('common.confirm')}
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
  const parseColumns = useMemo(() => previewContent.length
    ? previewContent[0].map((header, index) => {
      const textIndex = index;
      const title = activeItem?.withHeader ? header : `Column ${textIndex}`;
      return {
        title,
        dataIndex: index,
        render: value => <span className={styles.limitWidth}>{value}</span>,
      };
    })
    : [], [previewContent, activeItem]);
  const handleConfirm = useCallback(() => {
    const existFileName = fileList.map((file) => file.name);
    const repeatFiles = data.filter((file) => existFileName.includes(file.name));
    if(!repeatFiles.length) {
      startImport();
      return;
    }
    const repeatFileNames = repeatFiles.map((file) => file.name).join(', ');
    Modal.confirm({
      title: <>
        <ExclamationCircleFilled />
        {intl.get('import.uploadConfirm')}
      </>,
      icon: null,
      content: <>
        <div className={styles.repeatBox}>{repeatFileNames}</div>
        <p>{intl.get('import.fileRepeatTip')}</p>
      </>,
      okText: intl.get('common.continue'),
      cancelText: intl.get('common.cancel'),
      centered: true,
      wrapClassName: styles.repeatConfirmModal,
      onOk: () => {
        startImport();
      },
    });
  }, [fileList, data]);
  const startImport = useCallback(async () => {
    setState({ uploading: true });
    const res = await uploadFile(data);
    if(res.code === 0) {
      onConfirm();
    }
    setState({ uploading: false });
  }, [state]);
  const handleCancel = useCallback(() => {
    !uploading && onCancel();
  }, [uploading]);

  if(!visible) {
    return null;
  }

  return (
    <Modal
      title={intl.get('import.previewFiles')}
      open={visible}
      width={920}
      onCancel={() => handleCancel()}
      className={styles.uploadModal}
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
            scroll={{ x: 'max-content' }}
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

export default observer(UploadConfigModal);
