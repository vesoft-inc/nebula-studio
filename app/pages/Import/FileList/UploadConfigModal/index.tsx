import Icon from '@app/components/Icon';
import { useI18n } from '@vesoft-inc/i18n';
import { Button, Input, Modal, Table, Popconfirm, Dropdown, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import React, { useCallback, useEffect, useState } from 'react';
import { usePapaParse } from 'react-papaparse';
import cls from 'classnames';
import { StudioFile } from '@app/interfaces/import';
import { useStore } from '@app/stores';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { observable } from 'mobx';
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
  const state = useLocalObservable(() => ({
    data: [],
    activeItem: null,
    previewContent: [],
    // checkAll: false,
    // indeterminate: false,
    loading: false,
    uploading: false,
    setState: (obj) => Object.assign(state, obj),
  }), { data: observable.ref });
  const { readRemoteFile } = usePapaParse();
  useEffect(() => {
    const { setState } = state;
    visible && setState({ data: uploadList, activeItem: uploadList[0] });
  }, [visible]);
  useEffect(() => {
    state.activeItem && readFile();
  }, [state.activeItem]);
  const readFile = useCallback(() => {
    const { activeItem, setState } = state;
    if(!activeItem) return;
    setState({ loading: true });
    const url = URL.createObjectURL(activeItem);
    let content = [];
    readRemoteFile(url, { 
      delimiter: activeItem.delimiter, 
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

  // const onCheckAllChange = useCallback((e: CheckboxChangeEvent) => {
  //   const { data, setState } = state;
  //   const { checked } = e.target;
  //   setState({
  //     checkAll: checked,
  //     indeterminate: false,
  //     data: data.map(i => (i.withHeader = checked, i))
  //   });
  // }, []);

  // const updateItem = useCallback((e: CheckboxChangeEvent, item: StudioFile) => {
  //   const { data, setState } = state;
  //   const { checked } = e.target;
  //   const nextData = data.map(i => (i === item && (i.withHeader = checked), i));
  //   const checkedNum = data.reduce((n, file) => n + (file.withHeader & 1), 0);
  //   setState({
  //     checkAll: checkedNum === data.length,
  //     indeterminate: !!checkedNum && checkedNum < data.length,
  //     data: nextData
  //   });
  // }, []);
  const deletePreviewFile = useCallback((e: React.MouseEvent, index: number) => {
    const { activeItem, data, setState, previewContent } = state;
    e.stopPropagation();
    const isActive = activeItem?.uid === data[index].uid;
    const newData = data.filter((_, i) => i !== index);
    // const checkedNum = data.reduce((n, file) => n + (file.withHeader & 1), 0);
    setState({
      // checkAll: checkedNum === newData.length && newData.length > 0,
      // indeterminate: !!checkedNum && checkedNum < newData.length,
      data: newData,
      activeItem: isActive ? null : activeItem,
      previewContent: isActive ? [] : previewContent,
    });
  }, []);

  const updateDelimiter = useCallback((e: React.ChangeEvent<HTMLInputElement>, item: StudioFile) => {
    const { activeItem } = state;
    e.stopPropagation();
    item.delimiter = e.target.value;
    item === activeItem && readFile();
  }, []);

  const updateAllDelimiter = useCallback((value: string) => {
    const { data } = state;
    setState({
      data: data.map(item => (item.delimiter = value, item))
    });
    readFile();
  }, []);

  const handleConfirm = useCallback(() => {
    const { data } = state;
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
  }, [fileList]);
  const startImport = useCallback(async () => {
    const { data, setState } = state;
    setState({ uploading: true });
    const res = await uploadFile(data);
    if(res.code === 0) {
      onConfirm();
      message.success(intl.get('import.uploadSuccessfully'));
    }
    setState({ uploading: false });
  }, []);
  const handleCancel = useCallback(() => {
    const { uploading } = state;
    !uploading && onCancel();
  }, []);

  if(!visible) {
    return null;
  }
  const { uploading, data, activeItem, previewContent, loading, setState } = state;
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
  const columns = [
    {
      title: intl.get('import.fileName'),
      dataIndex: 'name',
      // align: 'center' as const,
      width: '60%'
    },
    // {
    //   title: <>
    //     <Checkbox checked={checkAll} indeterminate={indeterminate} onChange={onCheckAllChange} />
    //     <span style={{ paddingLeft: '5px' }}>{intl.get('import.withHeader')}</span>
    //   </>,
    //   key: 'withHeader',
    //   width: '30%',
    //   render: record => <Checkbox checked={record.withHeader} onChange={e => updateItem(e, record)}>{intl.get('import.hasHeader')}</Checkbox>,
    // },
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
