import { ArrowLeftOutlined, FileTextFilled, FolderFilled, SyncOutlined } from '@ant-design/icons';
import { IDatasourceType } from '@app/interfaces/datasource';
import { useStore } from '@app/stores';
import { useBatchState } from '@app/utils';
import { getFileSize } from '@app/utils/file';
import { useI18n } from '@vesoft-inc/i18n';
import { Button, Select, Spin } from 'antd';
import cls from 'classnames';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect } from 'react';
import styles from './index.module.less';
const Option = Select.Option;
interface IFileSelect {
  onConfirm: (file, cachedState) => void,
  cachedState?: any
}
const FileSelect = observer((props: IFileSelect) => {
  const { intl } = useI18n();
  const { datasource, files } = useStore();
  const { onConfirm, cachedState } = props;
  const { getDatasourceList, getDatasourceDetail, previewFile } = datasource;
  const { getFiles } = files;
  const { state, setState } = useBatchState({
    loading: false,
    options: [],
    directory: cachedState?.directory || [],
    path: cachedState?.path || '',
    activeId: cachedState?.activeId,
    activeItem: cachedState?.activeItem,
  });
  const { options, directory, path, activeItem, activeId, loading } = state;
  const init = useCallback(async () => {
    setState({ loading: true });
    const data = await getDatasourceList();
    setState({
      options: data,
      loading: false,
    });
  }, []);

  const getLocalFiles = useCallback(async () => {
    const files = await getFiles();
    setState({
      directory: files,
      path: '/',
      loading: false,
      activeId: IDatasourceType.local
    });
  }, []);
  const getDatasourceDirectory = useCallback(async (id, path?) => {
    const data = await getDatasourceDetail({ id, path });
    setState({
      directory: data,
      activeId: id,
      path: path || '/',
      loading: false
    });
  }, []);
  
  useEffect(() => {
    init();
  }, []);
  const handleSelectFile = useCallback(async (item) => {
    if (item.type !== 'directory') return;
    setState({ loading: true });
    const newPath = `${path === '/' ? '' : path}${item.name}${item.type === 'directory' ? '/' : ''}`;
    getDatasourceDirectory(activeId, newPath);
  }, [path]);

  const handlePathBack = useCallback(async () => {
    if(!path || path === '/') return;
    setState({ loading: true });
    const _path = path.slice(0, -1).split('/');
    _path.pop();
    const newPath = _path.join('/').length ? _path.join('/') + '/' : '';
    getDatasourceDirectory(activeId, newPath);
  }, [path, activeId]);
  const handleTypeChange = useCallback(async (value) => {
    setState({ 
      loading: true,
      activeId: null,
      activeItem: null,
      path: '',
    });
    if(value === IDatasourceType.local) {
      getLocalFiles();
    } else {
      getDatasourceDirectory(value);
    }
  }, []);
  const handleRefresh = useCallback(async () => {
    setState({ loading: true });
    if (!activeId) {
      getLocalFiles();
      return;
    }
    const _path = !path || path === '/' ? '' : path;
    getDatasourceDirectory(activeId, _path);
  }, [activeId, path]);
  const handleConfirm = useCallback(async () => {
    if(activeItem && activeId === IDatasourceType.local) {
      // select local file
      onConfirm(activeItem, state);
    } else {
      setState({ loading: true });
      const _path = `${path === '/' ? '' : path}${activeItem.name}`;
      const data = await previewFile({ id: activeId, path: _path });
      const item = {
        name: activeItem.name,
        withHeader: false,
        delimiter: ',',
        sample: data.contents.join('\r\n'),
        path: _path,
        datasourceId: activeId === IDatasourceType.local ? null : activeId,
      } as any;
      setState({ loading: false });
      onConfirm(item, state);
    }
  }, [activeItem, activeId, path]);
  return <Spin spinning={loading}>
    <div className={styles.row}>
      <span className={styles.label}>{intl.get('import.datasourceType')}</span>
      <Select 
        className={styles.typeSelect}
        onChange={handleTypeChange}
        popupClassName={styles.typeOptions}
        optionLabelProp="label"
        defaultValue={activeId}
        dropdownMatchSelectWidth={false}>
        <Option value={IDatasourceType.local}>{intl.get('import.localFiles')}</Option>
        {options.map((item) => {
          const endpoint = item.type === IDatasourceType.s3 ? item.s3Config.endpoint : item.sftpConfig.host + ':' + item.sftpConfig.port;
          return <Option value={item.id} key={item.id} label={endpoint}>
            <span className={styles.typeItem} aria-label={endpoint}>
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
        disabled={!activeItem || activeItem.type === 'directory'}
        onClick={() => handleConfirm()}
      >
        {intl.get('common.add')}
      </Button>
    </div>
  </Spin>;
});

export default FileSelect;