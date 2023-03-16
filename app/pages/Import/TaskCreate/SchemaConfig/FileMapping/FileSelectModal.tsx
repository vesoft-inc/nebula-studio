import { ArrowLeftOutlined, FileTextFilled, FolderFilled, SyncOutlined } from '@ant-design/icons';
import { IDatasourceType } from '@app/interfaces/datasource';
import { useStore } from '@app/stores';
import { useBatchState } from '@app/utils';
import { getFileSize } from '@app/utils/file';
import { useI18n } from '@vesoft-inc/i18n';
import { Button, Modal, Select, Spin } from 'antd';
import cls from 'classnames';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';

import styles from './index.module.less';
const Option = Select.Option;
interface IProps {
  visible: boolean;
  onConfirm: (password: string) => void
  onCancel: () => void;
}
const ConfigConfirmModal = (props: IProps) => {
  const { visible, onConfirm, onCancel } = props;
  const { datasource, files } = useStore();
  const { getFiles } = files;
  const { getDatasourceList, getDatasourceDetail, previewFile } = datasource;
  const { intl } = useI18n();
  const { state, setState } = useBatchState({
    loading: false,
    options: [],
    directory: [],
    path: '',
    activeId: null,
    activeItem: null,
  });
  const { options, directory, path, activeItem, activeId, loading } = state;
  const handleConfirm = (password?: string) => {
    onConfirm(password);
  };
  const handleCancel = () => {
    onCancel();
  };

  const getLocalFiles = async () => {
    const files = await getFiles();
    setState({
      directory: files,
      path: '/',
      loading: false
    });
  };
  const getDatasourceDirectory = async (id, path?) => {
    const data = await getDatasourceDetail({ id, path });
    setState({
      directory: data,
      activeId: id,
      path: path || '/',
      loading: false
    });
  };
  const handleTypeChange = async (value) => {
    setState({ loading: true });
    if(value === IDatasourceType.local) {
      getLocalFiles();
    } else {
      getDatasourceDirectory(value);
    }
  };
  const init = async () => {
    setState({ loading: true });
    const data = await getDatasourceList();
    setState({
      options: data,
      loading: false
    });
  };
  const handleSelectFile = async (item) => {
    setState({ loading: true });
    const newPath = `${path === '/' ? '' : path}${item.name}${item.type === 'directory' ? '/' : ''}`;
    if(item.type === 'directory') {
      getDatasourceDirectory(activeId, newPath);
    } else {
      await previewFile({ id: activeId, path: newPath });
      setState({
        loading: false
      });
    }
  };
  const handlePathBack = async () => {
    if(!path || path === '/') return;
    setState({ loading: true });
    const _path = path.slice(0, -1).split('/');
    _path.pop();
    const newPath = _path.join('/').length ? _path.join('/') + '/' : '';
    getDatasourceDirectory(activeId, newPath);
  };

  const handleRefresh = async () => {
    setState({ loading: true });
    if (!activeId) {
      getLocalFiles();
      return;
    }
    const _path = !path || path === '/' ? '' : path;
    getDatasourceDirectory(activeId, _path);
  };
  useEffect(() => {
    init();
  }, []);
  return (
    <Modal
      title={intl.get('import.selectDatasourceFile')}
      open={visible}
      onCancel={() => handleCancel()}
      className={styles.selectFileModal}
      footer={false}
      width={700}
    >
      <Spin spinning={loading}>
        <div className={styles.row}>
          <span className={styles.label}>{intl.get('import.datasourceType')}</span>
          <Select 
            className={styles.typeSelect}
            onChange={handleTypeChange}
            popupClassName={styles.typeOptions}
            dropdownMatchSelectWidth={false}>
            <Option value={IDatasourceType.local} label={IDatasourceType.local}>{intl.get('import.localFiles')}</Option>
            {options.map((item) => {
              const endpoint = item.type === IDatasourceType.s3 ? item.s3Config.endpoint : item.sftpConfig.host + ':' + item.sftpConfig.port;
              return <Option value={item.id} key={item.id} label={item.id}>
                <span className={styles.typeItem} aria-label={item.id}>
                  <span className={styles.value}>{endpoint}</span>
                  <span className={styles.type}>{intl.get(`import.${IDatasourceType[item.type]}`)}</span>
                </span>
              </Option>;
            })}
          </Select>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>{intl.get('import.filePath')}</span>
          <div className={styles.operations}>
            <div className={styles.path}>{path}</div>
            <div className={cls(styles.btn, !path && styles.disabled)} onClick={handlePathBack}><ArrowLeftOutlined /></div>
            <div className={styles.btn} onClick={handleRefresh}><SyncOutlined /></div>
          </div>
        </div>
        <div className={styles.fileDirectory}>
          {directory.map((item) => (
            <div key={item.name} 
              className={cls(styles.item, activeItem === item && styles.actived)} 
              onClick={() => setState({ activeItem: item })}
              onDoubleClick={() => handleSelectFile(item)}
            >
              {item.type === 'directory' ? <FolderFilled className={styles.icon} /> : <FileTextFilled className={styles.icon} />}
              <div className={styles.content}>
                <span className={styles.title}>{item.name}</span>
                <span className={styles.desc}>{item.type === 'directory' ? intl.get('import.directory') : getFileSize(item.size)}</span>
              </div>
            </div>    
          ))}
        </div>
        <div className={styles.btns}>
          <Button
            type="primary"
            // disabled={!password}
            onClick={() => handleConfirm()}
          >
            {intl.get('common.add')}
          </Button>
        </div>
      </Spin>
      
    </Modal>
  );
};

export default observer(ConfigConfirmModal);
